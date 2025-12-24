import { useState, useEffect, useRef } from "react";
import { FaStepBackward, FaStepForward, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaVolumeDown, FaTimes } from "react-icons/fa";

// System default playlist - BẠN CÓ THỂ CHỈNH Ở ĐÂY
const SYSTEM_PLAYLIST = [
  { 
    id: "sys1", 
    title: "Lofi Rain sounds", 
    artist: "Chill Journal", 
    youtubeId: "9kzE8isXlQY",
    isSystem: true 
  },
  { 
    id: "sys2", 
    title: "Vintage Jazz", 
    artist: "Lepreezy", 
    youtubeId: "JElyhCKzhWI",
    isSystem: true 
  },
  { 
    id: "sys3", 
    title: "Alpha sounds", 
    artist: "Zen Melody", 
    youtubeId: "ihZYtrWTbkY",
    isSystem: true 
  },
  { 
    id: "sys4", 
    title: "Piano Study Music", 
    artist: "Relaxing Jazz Piano", 
    youtubeId: "MYPVQccHhAQ",
    isSystem: true 
  },
  { 
    id: "sys5", 
    title: "Japan Vibes", 
    artist: "Calm City", 
    youtubeId: "PLLRRXURicM",
    isSystem: true 
  },
];

export default function MusicPlayer({ panelColor = "#4aa6e0", onVideoToggle, playlist = [], onPlaylistChange }) {
  const [userPlaylist, setUserPlaylist] = useState(playlist);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState("system");
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const volumeRef = useRef(null);

  // Sync playlist prop with state
  useEffect(() => {
    if (Array.isArray(playlist) && playlist.length >= 0) {
      setUserPlaylist(playlist);
    }
  }, [playlist]);

  const systemPlaylist = SYSTEM_PLAYLIST;
  const currentPlaylist = activePlaylist === "system" ? systemPlaylist : userPlaylist;
  const currentTrack = currentPlaylist[currentTrackIndex];

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  // Load YouTube IFrame API once
  useEffect(() => {
    // Suppress YouTube postMessage errors
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('postMessage') || args[0].includes('target origin'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
      };
    }

    return () => {
      console.error = originalError;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update progress bar
  useEffect(() => {
    if (isPlaying && playerRef.current && playerReady) {
      progressIntervalRef.current = setInterval(() => {
        try {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          setCurrentTime(current);
          setDuration(total);
        } catch (e) {
          console.log('Progress update error:', e);
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, playerReady]);

  // Initialize player
  useEffect(() => {
    if (!currentTrack?.youtubeId) {
      return;
    }

    // Wait for API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      const container = document.getElementById('youtube-player-container');
      if (!container) {
        setTimeout(initPlayer, 100);
        return;
      }

      // Destroy old player
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore old player destroy errors
        }
        playerRef.current = null;
      }

      // Clear and recreate container
      container.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      container.appendChild(playerDiv);

      try {
        const playerHeight = showVideo ? '360' : '0';
        const playerWidth = showVideo ? '640' : '0';
        
        playerRef.current = new window.YT.Player('youtube-player', {
          height: playerHeight,
          width: playerWidth,
          videoId: currentTrack.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: showVideo ? 1 : 0,
            disablekb: showVideo ? 0 : 1,
            fs: showVideo ? 1 : 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              console.log('Player ready for:', currentTrack.youtubeId);
              setPlayerReady(true);
              event.target.setVolume(volume);
              const total = event.target.getDuration();
              setDuration(total);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
                setCurrentTrackIndex(nextIndex);
                setIsPlaying(false);
                setPlayerReady(false);
                setCurrentTime(0);
              }
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
            onError: () => {
              console.log('YouTube player error');
              setIsPlaying(false);
              setPlayerReady(false);
            }
          },
        });
      } catch {
        console.log('Player creation error');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initPlayer, 200);

    return () => clearTimeout(timer);
  }, [currentTrack?.youtubeId, volume, showVideo, currentTrackIndex, currentPlaylist.length]);

  // Update video display when track changes
  useEffect(() => {
    if (onVideoToggle && showVideo && currentTrack?.youtubeId) {
      onVideoToggle(true, currentTrack.youtubeId);
    } else if (onVideoToggle && !showVideo) {
      onVideoToggle(false, null);
    }
  }, [currentTrack?.youtubeId, showVideo, onVideoToggle]);

  // Sync playlist prop with state and notify parent of changes
  useEffect(() => {
    if (Array.isArray(playlist)) {
      setUserPlaylist(playlist);
    }
  }, [playlist]);

  // Notify parent when playlist changes
  useEffect(() => {
    if (onPlaylistChange && activePlaylist === "user") {
      onPlaylistChange(userPlaylist);
    }
  }, [userPlaylist, activePlaylist, onPlaylistChange]);

  const handlePlayPause = () => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {
      console.log('Play/Pause error');
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.setVolume(newVolume);
      } catch {
        console.log('Volume change error');
      }
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.seekTo(seekTime, true);
      } catch {
        console.log('Seek error');
      }
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    setCurrentTrackIndex(nextIndex);
    if (onVideoToggle && showVideo && currentPlaylist[nextIndex]?.youtubeId) {
      onVideoToggle(true, currentPlaylist[nextIndex].youtubeId);
    }
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    const prevIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    setCurrentTrackIndex(prevIndex);
    if (onVideoToggle && showVideo && currentPlaylist[prevIndex]?.youtubeId) {
      onVideoToggle(true, currentPlaylist[prevIndex].youtubeId);
    }
  };

  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleAddYoutubeLink = () => {
    const trimmedLink = youtubeLink.trim();
    if (!trimmedLink) {
      alert("Vui lòng nhập link YouTube!");
      return;
    }

    const videoId = extractYouTubeId(trimmedLink);
    if (videoId) {
      const newTrack = {
        id: `user-${Date.now()}`,
        title: `YouTube: ${videoId}`,
        artist: "Custom",
        youtubeId: videoId,
        isSystem: false
      };
      const updatedPlaylist = [...userPlaylist, newTrack];
      setUserPlaylist(updatedPlaylist);
      if (onPlaylistChange) {
        onPlaylistChange(updatedPlaylist);
      }
      setYoutubeLink("");
      setShowYoutubeInput(false);
      
      if (userPlaylist.length === 0) {
        setActivePlaylist("user");
        setCurrentTrackIndex(0);
        setPlayerReady(false);
      }
    } else {
      alert("Link YouTube không hợp lệ!\nVí dụ: https://youtube.com/watch?v=jfKfPfyJRdk\nHoặc chỉ ID: jfKfPfyJRdk");
    }
  };

  const handleRemoveTrack = (id) => {
    if (activePlaylist === "user") {
      const newPlaylist = userPlaylist.filter((track) => track.id !== id);
      setUserPlaylist(newPlaylist);
      
      if (currentTrackIndex >= newPlaylist.length && newPlaylist.length > 0) {
        setCurrentTrackIndex(newPlaylist.length - 1);
        setPlayerReady(false);
      } else if (newPlaylist.length === 0) {
        setActivePlaylist("system");
        setCurrentTrackIndex(0);
        setPlayerReady(false);
      }
    }
  };

  const switchPlaylist = (type) => {
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setActivePlaylist(type);
    setCurrentTrackIndex(0);
    setShowPlaylistSelector(false);
  };

  const selectTrack = (index) => {
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setCurrentTrackIndex(index);
    if (onVideoToggle && showVideo && currentPlaylist[index]?.youtubeId) {
      onVideoToggle(true, currentPlaylist[index].youtubeId);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold"> Nhạc nền</h4>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newShowVideo = !showVideo;
              setShowVideo(newShowVideo);
              if (onVideoToggle) {
                onVideoToggle(newShowVideo, newShowVideo ? currentTrack?.youtubeId : null);
              }
            }}
            className={`text-xs px-2 py-1 rounded hover:bg-opacity-30 transition-colors ${
              showVideo ? "bg-blue-500 text-white" : "bg-white/10 bg-opacity-20"
            }`}
            title={showVideo ? "Ẩn video" : "Hiện video"}
          >
            {showVideo ? "Hiện video" : "Ẩn video"}
          </button>
          <button
            onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
            className="text-xs px-2 py-1 bg-white/10 bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
             {activePlaylist === "system" ? "Hệ thống" : "Của tôi"}
          </button>
          <button
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className="text-xs px-2 py-1 bg-white/10 bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            + YouTube
          </button>
        </div>
      </div>

      {showPlaylistSelector && (
        <div className="mb-4 p-3 bg-white/10 bg-opacity-10 rounded-lg space-y-2">
          <button
            onClick={() => switchPlaylist("system")}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              activePlaylist === "system"
                ? "bg-white/10 bg-opacity-40 font-semibold"
                : "bg-white/10 bg-opacity-20 hover:bg-opacity-30"
            }`}
          >
             Playlist hệ thống ({systemPlaylist.length} bài)
          </button>
          <button
            onClick={() => switchPlaylist("user")}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              activePlaylist === "user"
                ? "bg-white/10 bg-opacity-40 font-semibold"
                : "bg-white/10 bg-opacity-20 hover:bg-opacity-30"
            }`}
            disabled={userPlaylist.length === 0}
          >
             Playlist của tôi ({userPlaylist.length} bài)
          </button>
        </div>
      )}

      {showYoutubeInput && (
        <div className="mb-4 p-3 bg-white/10 bg-opacity-10 rounded-lg">
          <label className="text-xs text-black text-opacity-70 mb-2 block">
            Link YouTube:
          </label>
          <input
            type="text"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddYoutubeLink();
              }
            }}
            placeholder=""
            className="w-full px-3 py-2 bg-gray-200 bg-opacity-20 rounded text-sm text-black placeholder-black placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddYoutubeLink}
              className="flex-1 px-3 py-1.5 bg-[#50B0FA] hover:bg-[#238ACC] text-white bg-opacity-30 rounded text-xs font-medium hover:bg-opacity-40 transition-colors"
            >
              Thêm vào playlist
            </button>
            <button
              onClick={() => {
                setShowYoutubeInput(false);
                setYoutubeLink("");
              }}
              className="px-3 py-1.5 bg-red-400 hover:bg-red-600 text-white bg-opacity-20 rounded text-xs font-medium hover:bg-opacity-30 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div 
        id="youtube-player-container" 
        ref={playerContainerRef}
        style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      ></div>

      {currentTrack && (
        <div className="mb-4 p-3 bg-white/10 bg-opacity-10 rounded-lg">
          <div className="text-sm font-medium mb-1 truncate">{currentTrack.title}</div>
          <div className="text-xs text-black text-opacity-70 truncate">{currentTrack.artist}</div>
          <div className="text-xs text-black text-opacity-50 mt-1">
            {activePlaylist === "system" ? "Playlist hệ thống" : "Playlist của tôi"}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-black bg-opacity-20 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,rgb(85, 223, 92) 0%, #4aa6e0 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
            disabled={!playerReady}
          />
          <div className="flex justify-between text-xs text-black text-opacity-60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play/Pause, Navigation and Volume */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full bg-white/10 bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            aria-label="Previous"
            disabled={currentPlaylist.length === 0}
          >
            <FaStepBackward className="w-4 h-4" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: isPlaying ? `${panelColor}80` : "rgba(255, 255, 255, 0.3)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!currentTrack || !playerReady}
          >
            {isPlaying ? (
              <FaPause className="w-5 h-5" />
            ) : (
              <FaPlay className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-white/10 bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            aria-label="Next"
            disabled={currentPlaylist.length === 0}
          >
            <FaStepForward className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="relative" ref={volumeRef}>
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-2 rounded-full bg-white/10 bg-opacity-20 hover:bg-opacity-30 transition-colors"
              aria-label="Volume"
            >
              <svg className="w-4 h-4 text-white text-opacity-70" fill="currentColor" viewBox="0 0 20 20">
                {volume === 0 ? (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.793a1 1 0 011.383.07zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : volume < 50 ? (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.793a1 1 0 011.383.07zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.793a1 1 0 011.383.07zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                )}
              </svg>
            </button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-gray-800 rounded-lg shadow-lg">
                <div className="flex flex-col items-center gap-2" style={{ height: '120px' }}>
                  <span className="text-xs text-white">{volume}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    orient="vertical"
                    className="h-24"
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '8px',
                      accentColor: '#4aa6e0',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Playlist */}
      {currentPlaylist.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-white text-opacity-70 mb-2 font-medium">
            {activePlaylist === "system" ? "Playlist hệ thống" : "Playlist của tôi"}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {currentPlaylist.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                  index === currentTrackIndex
                    ? "bg-white/10 bg-opacity-30"
                    : "bg-white/10 bg-opacity-10 hover:bg-opacity-20"
                }`}
              >
                <div
                  className="flex-1 truncate cursor-pointer"
                  onClick={() => selectTrack(index)}
                >
                  <div className="font-medium truncate">{track.title}</div>
                  <div className="text-white text-opacity-60 truncate">{track.artist}</div>
                </div>
                {!track.isSystem && (
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    className="ml-2 p-1 hover:bg-white/10 hover:bg-opacity-20 rounded transition-colors"
                    aria-label="Remove track"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {userPlaylist.length === 0 && activePlaylist === "user" && (
        <div className="mt-4 p-4 bg-white/10 bg-opacity-10 rounded-lg text-center">
          <p className="text-sm text-white text-opacity-70">
            Chưa có bài hát nào. Thêm link YouTube để tạo playlist riêng!
          </p>
        </div>
      )}
    </div>
  );
}