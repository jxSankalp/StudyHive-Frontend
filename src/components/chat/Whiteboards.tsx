// src/components/chat/Whiteboard.tsx

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
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
import { io } from "socket.io-client";
import { toast } from "sonner";
import api from "@/lib/axiosInstance";

type WhiteboardProps = {
  whiteboard?: WhiteboardType;
};

const Whiteboard = ({ whiteboard }: WhiteboardProps) => {
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

  const [color, setColor] = useState("#ffffff");
  const historyRef = useRef<any[]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!whiteboard) return;

    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("whiteboard:join", whiteboard._id, "your-user-id");
    });

    socket.on("whiteboard:update", (data: any) => {
      setLines(data);
      historyRef.current = historyRef.current.slice(0, historyStep + 1);
      historyRef.current.push(data);
      setHistoryStep(historyRef.current.length - 1);
    });

    socket.on("whiteboard:clear-all", () => {
      setLines([]);
      historyRef.current = [[]];
      setHistoryStep(0);
    });

    const fetchWhiteboardData = async () => {
      try {
        const response = await api.get(`/whiteboards/${whiteboard._id}`);
        const savedData = response.data.data.data;
// ...


        if (savedData) {
          try {
            const konvaData = JSON.parse(savedData);
            const layer = konvaData.children.find(
              (child: any) => child.className === "Layer"
            );
            if (layer && layer.children) {
              setLines(layer.children);
              historyRef.current = [layer.children];
              setHistoryStep(0);
            }
          } catch (e) {
            console.error("Failed to parse Konva JSON data:", e);
            toast.error("Failed to parse whiteboard content.");
          }
        } else {
          setLines([]);
        }
      } catch (error) {
        console.error("Failed to fetch whiteboard data:", error);
        toast.error("Failed to load whiteboard content.");
      }
    };

    fetchWhiteboardData();

    return () => {
      if (stageRef.current && socketRef.current) {
        const whiteboardData = stageRef.current.toJSON();
        socketRef.current.emit("whiteboard:save", {
          whiteboardId: whiteboard._id,
          whiteboardData,
        });
        socketRef.current.disconnect();
      }
    };
  }, [whiteboard?._id]);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    let newShape: any = { attrs: { tool, x: pos.x, y: pos.y } };

    if (tool === "pen" || tool === "eraser") {
      newShape.attrs.points = [0, 0];
      newShape.attrs.stroke = tool === "pen" ? color : "black";
      newShape.attrs.strokeWidth = tool === "pen" ? 5 : 20;
      newShape.attrs.tension = 0.5;
      newShape.attrs.lineCap = "round";
    } else if (tool === "text") {
      isDrawing.current = false;
      const textInput = prompt("Enter text:");
      if (textInput) {
        newShape.attrs.text = textInput;
        newShape.attrs.fontSize = 20;
        newShape.attrs.fill = color;
        const newLines = [...lines, newShape];
        setLines(newLines);
        socketRef.current.emit("whiteboard:draw", {
          whiteboardId: whiteboard?._id,
          drawingData: newLines,
        });
      }
      return;
    } else if (tool === "rectangle") {
      newShape.attrs.width = 1;
      newShape.attrs.height = 1;
      newShape.attrs.stroke = color;
      newShape.attrs.strokeWidth = 2;
    } else if (tool === "circle") {
      newShape.attrs.radius = 1;
      newShape.attrs.stroke = color;
      newShape.attrs.strokeWidth = 2;
    }

    setLines([...lines, newShape]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || tool === "text") return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const currentLines = [...lines];
    let lastShape = currentLines[currentLines.length - 1];

    if (!lastShape) return;

    if (tool === "pen" || tool === "eraser") {
      lastShape.attrs.points = lastShape.attrs.points.concat([
        point.x - lastShape.attrs.x,
        point.y - lastShape.attrs.y,
      ]);
      currentLines.splice(currentLines.length - 1, 1, lastShape);
    } else if (tool === "rectangle") {
      const startX = lastShape.attrs.x;
      const startY = lastShape.attrs.y;
      lastShape.attrs.width = point.x - startX;
      lastShape.attrs.height = point.y - startY;
      currentLines.splice(currentLines.length - 1, 1, lastShape);
    } else if (tool === "circle") {
      const startX = lastShape.attrs.x;
      const startY = lastShape.attrs.y;
      lastShape.attrs.radius = Math.sqrt(
        Math.pow(point.x - startX, 2) + Math.pow(point.y - startY, 2)
      );
      currentLines.splice(currentLines.length - 1, 1, lastShape);
    }

    setLines(currentLines);
    socketRef.current.emit("whiteboard:draw", {
      whiteboardId: whiteboard?._id,
      drawingData: currentLines,
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    // FIX: After a shape is drawn, add the new state to the history
    const newHistory = historyRef.current.slice(0, historyStep + 1);
    newHistory.push(lines);
    historyRef.current = newHistory;
    setHistoryStep(newHistory.length - 1);
  };

  const handleClear = () => {
    setLines([]);
    socketRef.current.emit("whiteboard:clear-all", {
      whiteboardId: whiteboard?._id,
    });
  };

  const handleSave = async () => {
    const whiteboardData = stageRef.current.toJSON();
    try {
      await api.put(`/whiteboards/${whiteboard?._id}/save`, {
        data: whiteboardData,
      });
      toast.success("Whiteboard saved successfully!");
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
      toast.error("Failed to save whiteboard.");
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const newHistoryStep = historyStep - 1;
      setHistoryStep(newHistoryStep);
      setLines(historyRef.current[newHistoryStep]);
      socketRef.current.emit("whiteboard:draw", {
        whiteboardId: whiteboard?._id,
        drawingData: historyRef.current[newHistoryStep],
      });
    }
  };

  const redo = () => {
    if (historyStep < historyRef.current.length - 1) {
      const newHistoryStep = historyStep + 1;
      setHistoryStep(newHistoryStep);
      setLines(historyRef.current[newHistoryStep]);
      socketRef.current.emit("whiteboard:draw", {
        whiteboardId: whiteboard?._id,
        drawingData: historyRef.current[newHistoryStep],
      });
    }
  };

  if (!whiteboard) {
    return null;
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{whiteboard.title}</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool("pen")}
              className={tool === "pen" ? "bg-gray-700/50" : ""}
            >
              <PenTool className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool("eraser")}
              className={tool === "eraser" ? "bg-gray-700/50" : ""}
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool("text")}
              className={tool === "text" ? "bg-gray-700/50" : ""}
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool("rectangle")}
              className={tool === "rectangle" ? "bg-gray-700/50" : ""}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool("circle")}
              className={tool === "circle" ? "bg-gray-700/50" : ""}
            >
              <CircleIcon className="w-4 h-4" />
            </Button>

            <div className="w-6 h-6 rounded-full border border-gray-600 overflow-hidden">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-full cursor-pointer"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyStep === 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyStep === historyRef.current.length - 1}
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <div
          className="flex-1 bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl overflow-hidden"
          ref={containerRef}
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseup={handleMouseUp}
            ref={stageRef}
            className="cursor-crosshair"
          >
            <Layer>
              {lines.map((shape, i) => {
                if (
                  shape.attrs.tool === "pen" ||
                  shape.attrs.tool === "eraser"
                ) {
                  return (
                    <Line
                      key={i}
                      {...shape.attrs}
                      globalCompositeOperation={
                        shape.attrs.tool === "eraser"
                          ? "destination-out"
                          : "source-over"
                      }
                    />
                  );
                } else if (shape.attrs.tool === "text") {
                  return <Text key={i} {...shape.attrs} />;
                } else if (shape.attrs.tool === "rectangle") {
                  return <Rect key={i} {...shape.attrs} />;
                } else if (shape.attrs.tool === "circle") {
                  return <Circle key={i} {...shape.attrs} />;
                }
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
