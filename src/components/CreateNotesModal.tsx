import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

interface CreateNotesModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

const CreateNotesModal: React.FC<CreateNotesModalProps> = ({
  showModal,
  setShowModal,
  setRefreshKey
}) => {

  const { id: chatId } = useParams();

 
  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (
      form.elements.namedItem("name") as HTMLInputElement
    )?.value.trim();

   
    try {
    
      const res = await axios.post("/api/notes", {
        name,
        content:"Go on .... ",
        chatId
      });

      const createdNote = res.data.chat;
      console.log(createdNote);

      toast.success("Note created successfully!");
      setShowModal(false);
      setRefreshKey((prev: number) => prev + 1); 
      form.reset();

    } catch (error: any) {
      console.error("Note creation failed:", error);
      toast.error("Failed to create note. Please try again.");
    }
  };


  return (
    showModal && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full relative border border-gray-700">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-white mb-4">
            Create New Note
          </h2>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <input
              name="name"
              placeholder="Name"
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create Notes
            </button>
          </form>
        </div>
      </div>
    )
  );
};

export default CreateNotesModal;
