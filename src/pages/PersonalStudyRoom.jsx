import { useState} from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StudyRoomTabBar from "../components/StudyRoomTabBar";
import DraggableWindow from "../components/DraggableWindow";
import PomodoroTimer from "../components/PomodoroTimer";
import MusicPlayer from "../components/MusicPlayer";
import AmbientSoundMixer from "../components/AmbientSoundMixer";
import TodoList from "../components/TodoList";
import NotePad from "../components/NotePad";
import DraggableNote from "../components/DraggableNote";
import ThemeSelector from "../components/ThemeSelector";
import { 
  FaClock, 
  FaMusic, 
  FaVolumeUp, 
  FaCheckSquare, 
  FaStickyNote, 
  FaYoutube,
  FaPalette
} from "react-icons/fa";

const DEFAULT_THEMES = [
  { id: 1, name: "Ocean Blue", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", color: "#4aa6e0" },
  { id: 2, name: "Forest Green", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", color: "#22c55e" },
  { id: 3, name: "Sunset Orange", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", color: "#f97316" },
  { id: 4, name: "Lavender Purple", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", color: "#a855f7" },
  { id: 5, name: "Rose Pink", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800", color: "#ec4899" },
  { id: 6, name: "Sky Blue", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800", color: "#3b82f6" },
];

const SYSTEM_PLAYLIST = [
  { id: "sys1", title: "Lofi Rain sounds", artist: "Chill Journal", youtubeId: "9kzE8isXlQY", isSystem: true },
  { id: "sys2", title: "Vintage Jazz", artist: "Lepreezy", youtubeId: "JElyhCKzhWI", isSystem: true },
  { id: "sys3", title: "Alpha sounds", artist: "Zen Melody", youtubeId: "ihZYtrWTbkY", isSystem: true },
  { id: "sys4", title: "Piano Study Music", artist: "Relaxing Jazz Piano", youtubeId: "MYPVQccHhAQ", isSystem: true },
  { id: "sys5", title: "Japan Vibes", artist: "Calm City", youtubeId: "PLLRRXURicM", isSystem: true },
];

export default function PersonalStudyRoom({ panelColor = "#4aa6e0" }) {
  const [themeColor, setThemeColor] = useState(panelColor);
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_THEMES[0].image);
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [maxZIndex, setMaxZIndex] = useState(100);
  const [windows, setWindows] = useState({
    timer: { visible: false, minimized: false, position: { x: 50, y: 50 }, zIndex: 10 },
    music: { visible: false, minimized: false, position: { x: 500, y: 50 }, zIndex: 11 },
    ambient: { visible: false, minimized: false, position: { x: 950, y: 50 }, zIndex: 12 },
    todo: { visible: false, minimized: false, position: { x: 50, y: 400 }, zIndex: 13 },
    notes: { visible: false, minimized: false, position: { x: 500, y: 400 }, zIndex: 14 },
    video: { visible: false, minimized: false, position: { x: 200, y: 200 }, zIndex: 15 },
    theme: { visible: false, minimized: false, position: { x: 300, y: 100 }, zIndex: 16 },
  });

  // REMOVED localStorage - All state is now in-memory only
  // Components will manage their own internal state

  const handleThemeChange = (selectedTheme) => {
    setThemeColor(selectedTheme.color || panelColor);
    if (selectedTheme.image) {
      setBackgroundImage(selectedTheme.image);
    } else {
      setBackgroundImage(null);
    }
    setWindows(prev => ({ ...prev, theme: { ...prev.theme, visible: false } }));
  };

  const handleWindowClose = (windowId) => {
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], visible: false } }));
  };

  const handleWindowMinimize = (windowId, minimized) => {
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], minimized } }));
  };

  const handleZIndexChange = (windowId) => {
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], zIndex: maxZIndex + 1 } }));
  };

  const toggleWindow = (windowId) => {
    setWindows(prev => {
      const currentWindow = prev[windowId];
      // If window is already visible, just bring it to front
      if (currentWindow.visible && !currentWindow.minimized) {
        setMaxZIndex(prev => prev + 1);
        return {
          ...prev,
          [windowId]: {
            ...currentWindow,
            minimized: false,
            zIndex: maxZIndex + 1,
          },
        };
      }
      // Otherwise, toggle visibility
      const newVisible = !currentWindow.visible;
      if (newVisible) {
        setMaxZIndex(prev => prev + 1);
      }
      return {
        ...prev,
        [windowId]: {
          ...currentWindow,
          visible: newVisible,
          minimized: false,
          zIndex: newVisible ? maxZIndex + 1 : currentWindow.zIndex,
        },
      };
    });
  };

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        background: `linear-gradient(to bottom right, ${themeColor}10, ${themeColor}20, ${themeColor}30)`,
      };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14 relative overflow-hidden">
        <Header />
        <div 
          className="absolute inset-0"
          style={backgroundStyle}
        >
          <div 
            className="absolute inset-0 transition-opacity"
            style={{ 
              backgroundColor: backgroundImage ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)" 
            }}
          />

          {/* Tab Bar - Bottom Right */}
          <StudyRoomTabBar onWindowToggle={toggleWindow} windows={windows} />

          {/* Windows - Only render if visible */}
          {windows.timer.visible && (
            <DraggableWindow
              id="timer"
              title="Pomodoro Timer"
              icon={FaClock}
              initialPosition={windows.timer.position}
              initialSize={{ width: 400, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.timer.minimized}
              zIndex={windows.timer.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <PomodoroTimer defaultMinutes={25} panelColor={themeColor} />
            </DraggableWindow>
          )}

          {windows.music.visible && (
            <DraggableWindow
              id="music"
              title="Music Player"
              icon={FaMusic}
              initialPosition={windows.music.position}
              initialSize={{ width: 450, height: 600 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.music.minimized}
              zIndex={windows.music.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <MusicPlayer 
                panelColor={themeColor} 
                onVideoToggle={(show, id) => {
                  setShowVideo(show);
                  setVideoId(id);
                  if (show) {
                    setWindows(prev => ({
                      ...prev,
                      video: { ...prev.video, visible: true, zIndex: maxZIndex + 1 }
                    }));
                    setMaxZIndex(prev => prev + 1);
                  }
                }} 
              />
            </DraggableWindow>
          )}

          {windows.ambient.visible && (
            <DraggableWindow
              id="ambient"
              title="Ambient Sounds"
              icon={FaVolumeUp}
              initialPosition={windows.ambient.position}
              initialSize={{ width: 400, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.ambient.minimized}
              zIndex={windows.ambient.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <AmbientSoundMixer panelColor={themeColor} />
            </DraggableWindow>
          )}

          {windows.todo.visible && (
            <DraggableWindow
              id="todo"
              title="Todo List"
              icon={FaCheckSquare}
              initialPosition={windows.todo.position}
              initialSize={{ width: 450, height: 500 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.todo.minimized}
              zIndex={windows.todo.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <TodoList />
            </DraggableWindow>
          )}

          {windows.notes.visible && (
            <DraggableWindow
              id="notes"
              title="Notes"
              icon={FaStickyNote}
              initialPosition={windows.notes.position}
              initialSize={{ width: 500, height: 400 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.notes.minimized}
              zIndex={windows.notes.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <NotePad onNotesChange={setNotes} />
            </DraggableWindow>
          )}

          {windows.video.visible && showVideo && videoId && (
            <DraggableWindow
              id="video"
              title="YouTube Video"
              icon={FaYoutube}
              initialPosition={windows.video.position}
              initialSize={{ width: 800, height: 500 }}
              onClose={() => {
                setShowVideo(false);
                setVideoId(null);
                handleWindowClose('video');
              }}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.video.minimized}
              zIndex={windows.video.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <div className="w-full h-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded"
                />
              </div>
            </DraggableWindow>
          )}

          {windows.theme.visible && (
            <DraggableWindow
              id="theme"
              title="Theme & Background"
              icon={FaPalette}
              initialPosition={windows.theme.position}
              initialSize={{ width: 600, height: 700 }}
              onClose={handleWindowClose}
              onMinimize={handleWindowMinimize}
              isMinimized={windows.theme.minimized}
              zIndex={windows.theme.zIndex}
              onZIndexChange={handleZIndexChange}
            >
              <ThemeSelector
                isOpen={true}
                onClose={() => handleWindowClose('theme')}
                onThemeSelect={handleThemeChange}
                currentTheme={null}
              />
            </DraggableWindow>
          )}

          {/* Draggable Notes on Screen */}
          <main className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="pointer-events-auto">
              {notes.map((note) => (
                <DraggableNote
                  key={note.id}
                  note={note}
                  onUpdate={(id, updatedNote) => {
                    setNotes(notes.map((n) => n.id === id ? updatedNote : n));
                  }}
                  onDelete={(id) => {
                    setNotes(notes.filter((n) => n.id !== id));
                  }}
                  onColorChange={(id, color) => {
                    setNotes(notes.map((n) => n.id === id ? { ...n, color } : n));
                  }}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}