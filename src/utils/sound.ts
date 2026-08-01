const audioCache: Record<string, HTMLAudioElement> = {};

if (typeof window !== "undefined") {
  const files = ["success.mp3", "confirm.mp3", "error.mp3", "notif.mp3", "paymentacc.mp3", "present.mp3"];
  files.forEach((file) => {
    const audio = new Audio(`/sound/${file}`);
    audio.load();
    audioCache[file] = audio;
  });
}

export const playSound = (soundFile: string) => {
  if (typeof window === "undefined") return;
  const soundMode = localStorage.getItem("setting_sound_mode") !== "hening";
  if (!soundMode) return;

  const cached = audioCache[soundFile];
  if (cached) {
    const audio = cached.cloneNode(true) as HTMLAudioElement;
    audio.currentTime = 0;
    audio.play().catch((err) => console.log("Failed to play sound:", err));
  } else {
    const fallbackAudio = new Audio(`/sound/${soundFile}`);
    fallbackAudio.play().catch((err) => console.log("Failed to play sound:", err));
  }
};

export const playSwalSound = (type: "success" | "confirm" | "error") => {
  if (type === "success") playSound("success.mp3");
  else if (type === "confirm") playSound("confirm.mp3");
  else if (type === "error") playSound("error.mp3");
};
