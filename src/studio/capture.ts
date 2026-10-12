export function cropToFrame(
  dataUrl: string,
  canvas: HTMLCanvasElement,
  frame: HTMLElement,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cRect = canvas.getBoundingClientRect();
      const fRect = frame.getBoundingClientRect();
      if (cRect.width < 2 || cRect.height < 2) {
        resolve(dataUrl);
        return;
      }
      const scaleX = img.width / cRect.width;
      const scaleY = img.height / cRect.height;
      let sx = (fRect.left - cRect.left) * scaleX;
      let sy = (fRect.top - cRect.top) * scaleY;
      let sw = fRect.width * scaleX;
      let sh = fRect.height * scaleY;
      if (sx < 0) {
        sw += sx;
        sx = 0;
      }
      if (sy < 0) {
        sh += sy;
        sy = 0;
      }
      if (sx + sw > img.width) sw = img.width - sx;
      if (sy + sh > img.height) sh = img.height - sy;
      if (sw < 2 || sh < 2) {
        resolve(dataUrl);
        return;
      }
      const out = document.createElement("canvas");
      const maxW = 1400;
      out.width = Math.min(maxW, Math.round(sw));
      out.height = Math.max(1, Math.round(out.width * (sh / sw)));
      const ctx = out.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
      resolve(out.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => reject(new Error("Could not read the frame"));
    img.src = dataUrl;
  });
}

let audio: AudioContext | null = null;

export function shutterSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === "suspended") void audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    /* sound is optional */
  }
}

export function downloadShot(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
