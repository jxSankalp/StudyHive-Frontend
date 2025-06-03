
import { Button } from '../ui/button';
import { PenTool } from 'lucide-react';
import type { Whiteboard } from '@/types';

type WhiteboardProps = {
  whiteboard?: Whiteboard;
};

const Whiteboards = ({ whiteboard }: WhiteboardProps) => {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{whiteboard?.title}</h1>
          <div className="flex items-center space-x-2">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PenTool className="w-4 h-4 mr-2" />
              Open Whiteboard
            </Button>
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Collaborators</h3>
              <p className="text-white text-lg">
                {whiteboard?.collaborators} people
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Last Modified</h3>
              <p className="text-white text-lg">{whiteboard?.lastModified}</p>
            </div>
          </div>
          <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">
              Whiteboard preview would appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboards