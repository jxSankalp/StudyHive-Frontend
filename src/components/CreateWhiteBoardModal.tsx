// src/components/CreateWhiteboardModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axiosInstance';

type CreateWhiteboardModalProps = {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  setRefreshKey: (key: number) => void;
};

const CreateWhiteboardModal = ({
  showModal,
  setShowModal,
  setRefreshKey,
}: CreateWhiteboardModalProps) => {
  const [whiteboardName, setWhiteboardName] = useState('');
  const [loading, setLoading] = useState(false);
  const { id: chatId } = useParams();

  const handleCreateWhiteboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whiteboardName.trim()) {
      toast.error('Whiteboard name is required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/whiteboards', {
        name: whiteboardName,
        groupId: chatId,
      });
      toast.success('Whiteboard created successfully!');
      setWhiteboardName('');
      setShowModal(false);
      setRefreshKey(Date.now()); // Trigger data refetch
    } catch (error) {
      console.error('Failed to create whiteboard:', error);
      toast.error('Failed to create whiteboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Whiteboard</DialogTitle>
          <DialogDescription>
            Enter a name for your new collaborative whiteboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateWhiteboard} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="whiteboard-name"
              placeholder="e.g., Brainstorming Session"
              value={whiteboardName}
              onChange={(e) => setWhiteboardName(e.target.value)}
              className="col-span-4"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWhiteboardModal;