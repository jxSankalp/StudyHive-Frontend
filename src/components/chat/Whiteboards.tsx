import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Eraser,
  Trash,
  Save,
  Square,
  Circle as CircleIcon,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";
import type { Whiteboard as WhiteboardType } from "@/types";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";

type Tool = "pen" | "eraser" | "text" | "rectangle" | "circle";

interface ShapeAttrs {
  tool: Tool;
  x: number;
  y: number;
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  tension?: number;
  lineCap?: CanvasLineCap;
  text?: string;
  fontSize?: number;
  fill?: string;
  width?: number;
  height?: number;
  radius?: number;
}

interface DrawingShape {
  className?: string;
  attrs: ShapeAttrs;
}

type PointerEvent = MouseEvent | TouchEvent;

const cloneShapes = (shapes: DrawingShape[]): DrawingShape[] =>
  shapes.map((shape) => ({
    ...shape,
    attrs: {
      ...shape.attrs,
      points: shape.attrs.points ? [...shape.attrs.points] : undefined,
    },
  }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTool = (value: unknown): value is Tool =>
  value === "pen" ||
  value === "eraser" ||
  value === "text" ||
  value === "rectangle" ||
  value === "circle";

const isDrawingShape = (value: unknown): value is DrawingShape => {
  if (!isRecord(value) || !isRecord(value.attrs)) return false;
  return (
    isTool(value.attrs.tool) &&
    typeof value.attrs.x === "number" &&
    typeof value.attrs.y === "number"
  );
};

const parseSavedShapes = (savedData: unknown): DrawingShape[] => {
  if (!savedData) return [];
  try {
    const parsed: unknown = typeof savedData === "string" ? JSON.parse(savedData) : savedData;
    if (!isRecord(parsed) || !Array.isArray(parsed.children)) return [];
    const layer = parsed.children.find(
      (child) => isRecord(child) && child.className === "Layer"
    );
    if (!isRecord(layer) || !Array.isArray(layer.children)) return [];
    return layer.children.filter(isDrawingShape).map((shape) => cloneShapes([shape])[0]);
  } catch {
    return [];
  }
};

const Whiteboard = ({ whiteboard }: { whiteboard?: WhiteboardType }) => {
  const [tool, setTool] = useState<Tool>("pen");
  const [lines, setLines] = useState<DrawingShape[]>([]);
  const [color, setColor] = useState("#ffffff");
  const [historyStep, setHistoryStep] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const isDrawing = useRef(false);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<DrawingShape[]>([]);
  const historyRef = useRef<DrawingShape[][]>([[]]);
  const historyStepRef = useRef(0);

  const setDrawingState = (next: DrawingShape[]) => {
    const cloned = cloneShapes(next);
    linesRef.current = cloned;
    setLines(cloned);
  };

  const commitHistory = (next: DrawingShape[]) => {
    const snapshot = cloneShapes(next);
    const history = historyRef.current.slice(0, historyStepRef.current + 1);
    history.push(snapshot);
    historyRef.current = history;
    historyStepRef.current = history.length - 1;
    setHistoryStep(historyStepRef.current);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () =>
      setStageSize({ width: container.clientWidth, height: container.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!whiteboard?._id) return;
    const whiteboardId = whiteboard._id;
    let active = true;

    const joinWhiteboard = () => socket.emit("whiteboard:join", whiteboardId);
    const handleRemoteUpdate = (value: unknown) => {
      if (!Array.isArray(value)) return;
      const shapes = value.filter(isDrawingShape);
      if (shapes.length !== value.length) return;
      setDrawingState(shapes);
      commitHistory(shapes);
    };
    const handleRemoteClear = () => {
      setDrawingState([]);
      commitHistory([]);
    };

    socket.on("connect", joinWhiteboard);
    socket.on("connected", joinWhiteboard);
    socket.on("whiteboard:update", handleRemoteUpdate);
    socket.on("whiteboard:clear-all", handleRemoteClear);
    socket.connect();
    if (socket.connected) joinWhiteboard();

    api
      .get<{ data: WhiteboardType }>(`/whiteboards/${whiteboardId}`)
      .then((response) => {
        if (!active) return;
        const saved = parseSavedShapes(response.data.data.data);
        setDrawingState(saved);
        historyRef.current = [cloneShapes(saved)];
        historyStepRef.current = 0;
        setHistoryStep(0);
      })
      .catch((error: unknown) => {
        if (active) toast.error(getApiErrorMessage(error, "Failed to load whiteboard content."));
      });

    return () => {
      active = false;
      socket.emit("whiteboard:leave", whiteboardId);
      socket.off("connect", joinWhiteboard);
      socket.off("connected", joinWhiteboard);
      socket.off("whiteboard:update", handleRemoteUpdate);
      socket.off("whiteboard:clear-all", handleRemoteClear);
    };
  }, [whiteboard?._id]);

  const publish = (next: DrawingShape[]) => {
    if (!whiteboard?._id) return;
    socket.emit("whiteboard:draw", {
      whiteboardId: whiteboard._id,
      drawingData: next,
    });
  };

  const handlePointerDown = (event: KonvaEventObject<PointerEvent>) => {
    const stage = event.target.getStage();
    const position = stage?.getPointerPosition();
    if (!position) return;

    if (tool === "text") {
      const text = window.prompt("Enter text:")?.trim();
      if (!text) return;
      const next = [
        ...linesRef.current,
        { attrs: { tool, x: position.x, y: position.y, text, fontSize: 20, fill: color } },
      ];
      setDrawingState(next);
      commitHistory(next);
      publish(next);
      return;
    }

    isDrawing.current = true;
    const attrs: ShapeAttrs = { tool, x: position.x, y: position.y };
    if (tool === "pen" || tool === "eraser") {
      Object.assign(attrs, {
        points: [0, 0],
        stroke: tool === "pen" ? color : "#000000",
        strokeWidth: tool === "pen" ? 5 : 20,
        tension: 0.5,
        lineCap: "round" as CanvasLineCap,
      });
    } else if (tool === "rectangle") {
      Object.assign(attrs, { width: 1, height: 1, stroke: color, strokeWidth: 2 });
    } else if (tool === "circle") {
      Object.assign(attrs, { radius: 1, stroke: color, strokeWidth: 2 });
    }
    setDrawingState([...linesRef.current, { attrs }]);
  };

  const handlePointerMove = (event: KonvaEventObject<PointerEvent>) => {
    if (!isDrawing.current) return;
    const position = event.target.getStage()?.getPointerPosition();
    if (!position) return;

    const next = cloneShapes(linesRef.current);
    const last = next[next.length - 1];
    if (!last) return;
    const attrs = last.attrs;
    if (attrs.tool === "pen" || attrs.tool === "eraser") {
      attrs.points = [...(attrs.points ?? []), position.x - attrs.x, position.y - attrs.y];
    } else if (attrs.tool === "rectangle") {
      attrs.width = position.x - attrs.x;
      attrs.height = position.y - attrs.y;
    } else if (attrs.tool === "circle") {
      attrs.radius = Math.hypot(position.x - attrs.x, position.y - attrs.y);
    }
    setDrawingState(next);
    publish(next);
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    commitHistory(linesRef.current);
  };

  const handleClear = () => {
    setDrawingState([]);
    commitHistory([]);
    if (whiteboard?._id) socket.emit("whiteboard:clear-all", { whiteboardId: whiteboard._id });
  };

  const handleSave = async () => {
    if (!whiteboard?._id || !stageRef.current) return;
    try {
      await api.put(`/whiteboards/${whiteboard._id}/save`, { data: stageRef.current.toJSON() });
      toast.success("Whiteboard saved.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save whiteboard."));
    }
  };

  const moveInHistory = (nextStep: number) => {
    const snapshot = historyRef.current[nextStep];
    if (!snapshot) return;
    historyStepRef.current = nextStep;
    setHistoryStep(nextStep);
    setDrawingState(snapshot);
    publish(snapshot);
  };

  if (!whiteboard) return null;

  return (
    <div className="flex-1 p-4 sm:p-8 min-h-0">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white">{whiteboard.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {([
              ["pen", PenTool],
              ["eraser", Eraser],
              ["text", Type],
              ["rectangle", Square],
              ["circle", CircleIcon],
            ] as const).map(([value, Icon]) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setTool(value)}
                className={tool === value ? "bg-gray-700/50" : ""}
                aria-label={`Use ${value} tool`}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="w-8 h-8 cursor-pointer rounded border border-gray-600 bg-transparent"
              aria-label="Drawing color"
            />
            <Button variant="outline" size="sm" onClick={() => moveInHistory(historyStep - 1)} disabled={historyStep === 0}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveInHistory(historyStep + 1)} disabled={historyStep >= historyRef.current.length - 1}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} aria-label="Clear whiteboard">
              <Trash className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-[320px] bg-gray-900/40 border border-gray-700/30 rounded-2xl overflow-hidden" ref={containerRef}>
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            ref={stageRef}
            className="cursor-crosshair"
          >
            <Layer>
              {lines.map((shape, index) => {
                const { tool: shapeTool, ...attrs } = shape.attrs;
                if (shapeTool === "pen" || shapeTool === "eraser") {
                  return (
                    <Line
                      key={index}
                      {...attrs}
                      points={attrs.points ?? []}
                      globalCompositeOperation={shapeTool === "eraser" ? "destination-out" : "source-over"}
                    />
                  );
                }
                if (shapeTool === "text") return <Text key={index} {...attrs} text={attrs.text ?? ""} />;
                if (shapeTool === "rectangle") return <Rect key={index} {...attrs} />;
                if (shapeTool === "circle") return <Circle key={index} {...attrs} />;
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
