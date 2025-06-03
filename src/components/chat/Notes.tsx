import { Button } from '../ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type {Note} from '@/types';

type NoteCardProps = {
    note?: Note;
  };

const Notes = ( {note}: NoteCardProps ) => {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{note?.title}</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8">
          <p className="text-gray-300 leading-relaxed text-lg">
            {note?.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notes