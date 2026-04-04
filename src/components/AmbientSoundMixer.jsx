import { useState, useEffect, useRef } from "react";
import { FaVolumeUp, FaPause, FaCloudRain, FaKeyboard, FaWater, FaFire, FaCoffee, FaExclamationTriangle } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

// WORKAROUND: Google Drive có thể block direct audio streaming
// Giải pháp tốt nhất: Upload lên GitHub hoặc Cloudinary
// Hoặc dùng Google Drive với format khác (xem bên dưới)

const AMBIENT_SOUNDS = [
  { 
    id: "rain", 
    icon: FaCloudRain,
    url: "https://files.catbox.moe/k21t10.mp3" 
    
  },
  { 
    id: "keyboard", 
    icon: FaKeyboard,
    url: "https://files.catbox.moe/dc7ta8.mp3"
  },
  { 
    id: "ocean", 
    icon: FaWater,
    url: "https://files.catbox.moe/l8k7xh.mp3"
  },
  { 
    id: "fire", 
    icon: FaFire,
    url: "https://files.catbox.moe/d5u5fj.mp3"
  },
  { 
    id: "cafe", 
    icon: FaCoffee,
    url: "https://files.catbox.moe/kzztlk.mp3"
  },
];

export default function AmbientSoundMixer({ panelColor = "#50B0FA" }) {
  const { language } = useLanguage();
  // Mặc định tất cả âm thanh là OFF và volume = 0
  const [sounds, setSounds] = useState(
    AMBIENT_SOUNDS.map((sound) => ({
      ...sound,
      isPlaying: false,
      volume: 0, // Mặc định volume = 0
    }))
  );
  const audioRefs = useRef({});
  const playPromises = useRef({}); // Track play promises to prevent race conditions

  // Initialize audio elements only once
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;
    
    AMBIENT_SOUNDS.forEach((sound) => {
      if (!currentAudioRefs[sound.id] && sound.url && sound.url.trim() !== "") {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0;
        audio.preload = "metadata";
        
        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
          console.warn(`⚠️ Could not load audio: ${sound.name}. Check if URL is accessible.`);
        });
        
        // Add canplay event to verify audio loaded successfully
        audio.addEventListener('canplay', () => {
          console.log(`✓ Audio ready: ${sound.name}`);
        });
        
        audio.src = sound.url;
        currentAudioRefs[sound.id] = audio;
      }
    });

    return () => {
      // Cleanup: stop all audio on unmount
      Object.values(currentAudioRefs).forEach((audio) => {
        if (audio) {
          if (playPromises.current[audio]) {
            playPromises.current[audio].then(() => {
              audio.pause();
              audio.currentTime = 0;
            }).catch(() => {
              audio.pause();
              audio.currentTime = 0;
            });
          } else {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      });
    };
  }, []);

  const toggleSound = (soundId) => {
    const audio = audioRefs.current[soundId];
    if (!audio) return;

    setSounds((prevSounds) =>
      prevSounds.map((sound) => {
        if (sound.id === soundId) {
          const newIsPlaying = !sound.isPlaying;
          
          if (newIsPlaying) {
            // Wait for any pending play promises to resolve first
            if (playPromises.current[soundId]) {
              playPromises.current[soundId]
                .then(() => {
                  const promise = audio.play();
                  playPromises.current[soundId] = promise;
                  return promise;
                })
                .catch((err) => {
                  console.error("Audio play failed:", err);
                  // Reset playing state on error
                  setSounds(prev => prev.map(s => 
                    s.id === soundId ? { ...s, isPlaying: false } : s
                  ));
                });
            } else {
              const promise = audio.play();
              playPromises.current[soundId] = promise;
              
              promise.catch((err) => {
                console.error("Audio play failed:", err);
                // Reset playing state on error
                setSounds(prev => prev.map(s => 
                  s.id === soundId ? { ...s, isPlaying: false } : s
                ));
              });
            }
          } else {
            // Wait for any pending play promises before pausing
            if (playPromises.current[soundId]) {
              playPromises.current[soundId]
                .then(() => {
                  audio.pause();
                  playPromises.current[soundId] = null;
                })
                .catch(() => {
                  audio.pause();
                  playPromises.current[soundId] = null;
                });
            } else {
              audio.pause();
            }
          }
          
          return { ...sound, isPlaying: newIsPlaying };
        }
        return sound;
      })
    );
  };

  const handleVolumeChange = (soundId, newVolume) => {
    const audio = audioRefs.current[soundId];
    if (audio) {
      audio.volume = newVolume / 100;
      
      // Auto-play when volume is increased from 0
      if (newVolume > 0) {
        const currentSound = sounds.find(s => s.id === soundId);
        if (currentSound && !currentSound.isPlaying) {
          // Start playing automatically when user adjusts volume
          const promise = audio.play();
          playPromises.current[soundId] = promise;
          
          promise
            .then(() => {
              setSounds((prevSounds) =>
                prevSounds.map((sound) =>
                  sound.id === soundId 
                    ? { ...sound, volume: newVolume, isPlaying: true } 
                    : sound
                )
              );
            })
            .catch((err) => {
              console.error("Auto-play failed:", err);
              // Just update volume without playing
              setSounds((prevSounds) =>
                prevSounds.map((sound) =>
                  sound.id === soundId ? { ...sound, volume: newVolume } : sound
                )
              );
            });
          return; // Exit early since we're updating state in the promise
        }
      }
    }

    setSounds((prevSounds) =>
      prevSounds.map((sound) =>
        sound.id === soundId ? { ...sound, volume: newVolume } : sound
      )
    );
  };

  const stopAll = () => {
    setSounds((prevSounds) =>
      prevSounds.map((sound) => {
        const audio = audioRefs.current[sound.id];
        if (audio) {
          // Wait for any pending play promises before pausing
          if (playPromises.current[sound.id]) {
            playPromises.current[sound.id]
              .then(() => {
                audio.pause();
                playPromises.current[sound.id] = null;
              })
              .catch(() => {
                audio.pause();
                playPromises.current[sound.id] = null;
              });
          } else {
            audio.pause();
          }
        }
        return { ...sound, isPlaying: false };
      })
    );
  };

  const playingCount = sounds.filter((s) => s.isPlaying).length;
  const hasValidUrls = AMBIENT_SOUNDS.some(s => s.url && s.url.trim() !== "");

  return (
    <div>
      {!hasValidUrls && (
        <div className="mb-4 p-3 bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg flex items-start gap-2">
          <FaExclamationTriangle className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-100">
            <strong>{t("ambientSoundMixer.noticeLabel", language)}</strong>{" "}
            {t("ambientSoundMixer.noticeText", language)}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">🔊 {t("ambientSoundMixer.title", language)}</h4>
        {playingCount > 0 && (
          <button
            onClick={stopAll}
            className="text-xs px-2 py-1 bg-white/10 bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            {t("ambientSoundMixer.stopAll", language, { count: playingCount })}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {sounds.map((sound) => (
          <div key={sound.id} className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSound(sound.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    sound.isPlaying
                      ? "bg-white bg-opacity-30 scale-110"
                      : "bg-white bg-opacity-20 hover:bg-opacity-30"
                  }`}
                  style={
                    sound.isPlaying
                      ? { backgroundColor: `${panelColor}80` }
                      : {}
                  }
                  aria-label={t("ambientSoundMixer.toggleAriaLabel", language, {
                    sound: t(`ambientSoundMixer.sounds.${sound.id}`, language),
                  })}
                >
                  {sound.isPlaying ? (
                    <FaPause className="w-4 h-4 text-white" />
                  ) : (
                    (() => {
                      const IconComponent = sound.icon;
                      return <IconComponent className="w-4 h-4 text-white" />;
                    })()
                  )}
                </button>
                <div>
                  <div className="text-sm font-medium">
                    {t(`ambientSoundMixer.sounds.${sound.id}`, language)}
                  </div>
                  <div className="text-xs text-white text-opacity-60">
                    {sound.isPlaying
                      ? t("ambientSoundMixer.status.playing", language)
                      : t("ambientSoundMixer.status.paused", language)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FaVolumeUp className="w-4 h-4 text-white text-opacity-70 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={sound.volume}
                onChange={(e) =>
                  handleVolumeChange(sound.id, parseInt(e.target.value))
                }
                className="flex-1"
                style={{ accentColor: '#50B0FA' }}
              />
              <span className="text-xs text-white text-opacity-70 w-10 text-right">
                {sound.volume}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-white text-opacity-50 text-center">
        💡 {t("ambientSoundMixer.tip", language)}
      </div>
    </div>
  );
}