import { Button } from "../ui/button";
import { Video } from "lucide-react";
import type { Meeting } from "@/types";
import { Link } from "react-router-dom";

type MeetingProps = {
  meeting?: Meeting;
};

const Meetings = ({ meeting }: MeetingProps) => {
  console.log(meeting?.id);
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{meeting?.name}</h1>
          <div className="flex items-center space-x-2">
            <Link to={`/meeting/${meeting?.id}`}>
            <Button className="bg-green-600 hover:bg-green-700">
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
            </Link>
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Participants</h3>
              <p className="text-white text-lg">
                {meeting?.participants} people
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Duration</h3>
              <p className="text-white text-lg">{meeting?.duration}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Status</h3>
              <p className="text-white text-lg capitalize">{meeting?.status}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Scheduled Time</h3>
              <p className="text-white text-lg">{meeting?.scheduledTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meetings;
