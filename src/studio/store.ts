import { create } from "zustand";
import {
  LIGHT_PRESETS,
  type AspectId,
  type BackdropId,
  type GelId,
  type LightSpec,
  type PresetId,
  type Shot,
  type SubjectId,
} from "./data";

const catalog = LIGHT_PRESETS[0];

type Studio = {
  subjectId: SubjectId;
  aspectId: AspectId;
  presetId: PresetId;
  backdropId: BackdropId;
  exposure: number;
  focal: number;
  floorGloss: number;
  key: LightSpec;
  fill: LightSpec;
  rim: LightSpec;
  yaw: number;
  autoSpin: boolean;
  spinSpeed: number;
  showGuides: boolean;
  thirds: boolean;
  ready: boolean;
  shots: Shot[];
  capture: (() => string) | null;
  cameraToken: number;
  setSubject: (id: SubjectId) => void;
  stepSubject: (dir: 1 | -1) => void;
  setAspect: (id: AspectId) => void;
  cycleAspect: () => void;
  applyPreset: (id: Exclude<PresetId, "custom">) => void;
  setBackdrop: (id: BackdropId) => void;
  setExposure: (value: number) => void;
  setFocal: (value: number) => void;
  setFloorGloss: (value: number) => void;
  patchLight: (which: "key" | "fill" | "rim", patch: Partial<LightSpec>) => void;
  setLightGel: (which: "key" | "fill" | "rim", gel: GelId) => void;
  setYaw: (radians: number) => void;
  setAutoSpin: (on: boolean) => void;
  setSpinSpeed: (value: number) => void;
  setShowGuides: (on: boolean) => void;
  setThirds: (on: boolean) => void;
  setReady: (ready: boolean) => void;
  setCapture: (fn: (() => string) | null) => void;
  addShot: (shot: Shot) => void;
  removeShot: (id: string) => void;
  bumpCamera: () => void;
};

function persistShots(shots: Shot[]) {
  try {
    localStorage.setItem("lumen-roll-v1", JSON.stringify(shots));
  } catch {
    try {
      const slim = shots.slice(0, 3);
      localStorage.setItem("lumen-roll-v1", JSON.stringify(slim));
    } catch {
      /* keep the roll in memory */
    }
  }
}

export const useStudio = create<Studio>((set, get) => ({
  subjectId: "flacon",
  aspectId: "4:5",
  presetId: catalog.id,
  backdropId: catalog.backdrop,
  exposure: catalog.exposure,
  focal: catalog.focal,
  floorGloss: catalog.floorGloss,
  key: { ...catalog.key },
  fill: { ...catalog.fill },
  rim: { ...catalog.rim },
  yaw: 0.42,
  autoSpin: false,
  spinSpeed: 0.45,
  showGuides: false,
  thirds: true,
  ready: false,
  shots: [],
  capture: null,
  cameraToken: 0,
  setSubject: (subjectId) => set({ subjectId }),
  stepSubject: (dir) => {
    const order = ["flacon", "chrono", "cans", "prism", "vessel", "range", "halo", "still"] as const;
    const index = order.indexOf(get().subjectId);
    const next = order[(index + dir + order.length) % order.length];
    set({ subjectId: next });
  },
  setAspect: (aspectId) => set({ aspectId }),
  cycleAspect: () => {
    const order = ["4:5", "1:1", "3:2", "16:9"] as const;
    const index = order.indexOf(get().aspectId);
    set({ aspectId: order[(index + 1) % order.length] });
  },
  applyPreset: (id) => {
    const preset = LIGHT_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    set({
      presetId: preset.id,
      exposure: preset.exposure,
      focal: preset.focal,
      backdropId: preset.backdrop,
      floorGloss: preset.floorGloss,
      key: { ...preset.key },
      fill: { ...preset.fill },
      rim: { ...preset.rim },
    });
  },
  setBackdrop: (backdropId) => set({ backdropId, presetId: "custom" }),
  setExposure: (exposure) => set({ exposure, presetId: "custom" }),
  setFocal: (focal) => set({ focal, presetId: "custom" }),
  setFloorGloss: (floorGloss) => set({ floorGloss, presetId: "custom" }),
  patchLight: (which, patch) =>
    set((state) => ({
      [which]: { ...state[which], ...patch },
      presetId: "custom",
    })),
  setLightGel: (which, gel) =>
    set((state) => ({
      [which]: { ...state[which], gel },
      presetId: "custom",
    })),
  setYaw: (yaw) => set({ yaw, autoSpin: false }),
  setAutoSpin: (autoSpin) => set({ autoSpin }),
  setSpinSpeed: (spinSpeed) => set({ spinSpeed }),
  setShowGuides: (showGuides) => set({ showGuides }),
  setThirds: (thirds) => set({ thirds }),
  setReady: (ready) => set({ ready }),
  setCapture: (capture) => set({ capture }),
  addShot: (shot) => {
    const shots = [shot, ...get().shots].slice(0, 8);
    set({ shots });
    persistShots(shots);
  },
  removeShot: (id) => {
    const shots = get().shots.filter((shot) => shot.id !== id);
    set({ shots });
    persistShots(shots);
  },
  bumpCamera: () => set((state) => ({ cameraToken: state.cameraToken + 1 })),
}));
