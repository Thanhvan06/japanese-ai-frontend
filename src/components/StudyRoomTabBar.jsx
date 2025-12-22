import { useState } from "react";
import { 
  FaClock, 
  FaMusic, 
  FaVolumeUp, 
  FaCheckSquare, 
  FaStickyNote, 
  FaYoutube,
  FaPalette,
  FaChevronUp,
  FaChevronDown
} from "react-icons/fa";

export default function StudyRoomTabBar({ onWindowToggle, windows }) {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: 'timer', icon: FaClock, label: 'Timer' },
    { id: 'music', icon: FaMusic, label: 'Music' },
    { id: 'ambient', icon: FaVolumeUp, label: 'Sound' },
    { id: 'todo', icon: FaCheckSquare, label: 'Todo' },
    { id: 'notes', icon: FaStickyNote, label: 'Note' },
    { id: 'video', icon: FaYoutube, label: 'YouTube' },
    { id: 'theme', icon: FaPalette, label: 'Theme' },
  ];

  return (
    <div className={`fixed bottom-0 right-0 z-[200] transition-all duration-300 ${
      isOpen ? 'translate-y-0' : 'translate-y-full'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-10 right-0 w-12 h-10 bg-white/90 backdrop-blur-sm rounded-t-lg shadow-lg 
          hover:bg-white transition-colors flex items-center justify-center border border-b-0 border-gray-300"
        aria-label={isOpen ? "Close tab bar" : "Open tab bar"}
      >
        {isOpen ? (
          <FaChevronDown className="w-4 h-4 text-gray-700" />
        ) : (
          <FaChevronUp className="w-4 h-4 text-gray-700" />
        )}
      </button>

      {/* Tab Bar */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-l border-gray-300 rounded-tl-lg shadow-lg">
        <div className="flex items-center gap-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = windows[tab.id]?.visible || false;
            return (
              <button
                key={tab.id}
                onClick={() => onWindowToggle(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                title={tab.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

