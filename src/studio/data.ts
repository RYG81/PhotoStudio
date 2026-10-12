export type GelId = "neutral" | "tungsten" | "daylight" | "rose" | "ice";
export type BackdropId = "porcelain" | "sand" | "blush" | "sage" | "fog" | "graphite" | "ink";
export type SubjectId = "flacon" | "chrono" | "cans" | "prism" | "vessel" | "range" | "halo" | "still";
export type AspectId = "4:5" | "1:1" | "3:2" | "16:9";
export type PresetId = "catalog" | "editorial" | "hero" | "soft" | "moody" | "custom";

export type LightSpec = {
  intensity: number;
  angle: number;
  height: number;
  distance: number;
  gel: GelId;
};

export type Shot = {
  id: string;
  url: string;
  subjectId: SubjectId;
  focal: number;
  aspectId: AspectId;
  presetId: PresetId;
  at: number;
};

export const GELS: { id: GelId; name: string; hex: string }[] = [
  { id: "neutral", name: "Neutral", hex: "#f6f3ec" },
  { id: "tungsten", name: "Tungsten", hex: "#ffb15e" },
  { id: "daylight", name: "Daylight", hex: "#d5e4ff" },
  { id: "rose", name: "Rose", hex: "#ffc2cc" },
  { id: "ice", name: "Ice", hex: "#b8fff2" },
];

export const BACKDROPS: { id: BackdropId; name: string; hex: string }[] = [
  { id: "porcelain", name: "Porcelain", hex: "#f3f0ea" },
  { id: "sand", name: "Sand", hex: "#e4cbae" },
  { id: "blush", name: "Blush", hex: "#efd4ce" },
  { id: "sage", name: "Sage", hex: "#c9d4c6" },
  { id: "fog", name: "Fog", hex: "#c5ced4" },
  { id: "graphite", name: "Graphite", hex: "#3a3a3a" },
  { id: "ink", name: "Ink", hex: "#14181e" },
];

export const SUBJECTS: { id: SubjectId; name: string; note: string }[] = [
  { id: "flacon", name: "Flacon", note: "Glass and rose" },
  { id: "chrono", name: "Chrono", note: "Steel watch" },
  { id: "cans", name: "Cans", note: "Matte black" },
  { id: "prism", name: "Prism", note: "Cut glass" },
  { id: "vessel", name: "Vessel", note: "Glazed clay" },
  { id: "range", name: "Range", note: "Brass lens" },
  { id: "halo", name: "Halo", note: "Twin rings" },
  { id: "still", name: "Still", note: "Three forms" },
];

export const ASPECTS: { id: AspectId; label: string; ratio: number }[] = [
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "3:2", label: "3:2", ratio: 3 / 2 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

export const LIGHT_PRESETS: {
  id: Exclude<PresetId, "custom">;
  name: string;
  note: string;
  exposure: number;
  focal: number;
  backdrop: BackdropId;
  floorGloss: number;
  key: LightSpec;
  fill: LightSpec;
  rim: LightSpec;
}[] = [
  {
    id: "catalog",
    name: "Catalog",
    note: "Even, honest, sellable",
    exposure: 1,
    focal: 50,
    backdrop: "porcelain",
    floorGloss: 0.42,
    key: { intensity: 150, angle: 38, height: 3.4, distance: 4.4, gel: "neutral" },
    fill: { intensity: 70, angle: -46, height: 1.8, distance: 4.8, gel: "neutral" },
    rim: { intensity: 40, angle: 168, height: 2.6, distance: 4.2, gel: "neutral" },
  },
  {
    id: "editorial",
    name: "Editorial",
    note: "Warm key, rose edge",
    exposure: 0.96,
    focal: 70,
    backdrop: "sand",
    floorGloss: 0.3,
    key: { intensity: 190, angle: 54, height: 2.7, distance: 3.8, gel: "tungsten" },
    fill: { intensity: 28, angle: -62, height: 1.3, distance: 5, gel: "neutral" },
    rim: { intensity: 110, angle: 188, height: 2.4, distance: 3.6, gel: "rose" },
  },
  {
    id: "hero",
    name: "Hero",
    note: "Dark field, bright rim",
    exposure: 0.88,
    focal: 62,
    backdrop: "ink",
    floorGloss: 0.72,
    key: { intensity: 140, angle: 28, height: 2.5, distance: 3.7, gel: "tungsten" },
    fill: { intensity: 16, angle: -70, height: 1.2, distance: 5.2, gel: "daylight" },
    rim: { intensity: 160, angle: 200, height: 2.8, distance: 3.4, gel: "ice" },
  },
  {
    id: "soft",
    name: "Softbox",
    note: "Wrapped, almost shadowless",
    exposure: 1.05,
    focal: 50,
    backdrop: "blush",
    floorGloss: 0.22,
    key: { intensity: 120, angle: 18, height: 3.8, distance: 4.6, gel: "neutral" },
    fill: { intensity: 100, angle: -24, height: 2.4, distance: 4.4, gel: "rose" },
    rim: { intensity: 24, angle: 150, height: 2.2, distance: 4.6, gel: "neutral" },
  },
  {
    id: "moody",
    name: "Moody",
    note: "One hard side, deep shade",
    exposure: 0.84,
    focal: 72,
    backdrop: "graphite",
    floorGloss: 0.55,
    key: { intensity: 210, angle: 72, height: 2.2, distance: 3.5, gel: "tungsten" },
    fill: { intensity: 10, angle: -30, height: 1.1, distance: 5.4, gel: "daylight" },
    rim: { intensity: 80, angle: 176, height: 3.1, distance: 3.8, gel: "rose" },
  },
];

export function gelHex(id: GelId): string {
  return GELS.find((g) => g.id === id)?.hex ?? "#f6f3ec";
}

export function backdropHex(id: BackdropId): string {
  return BACKDROPS.find((b) => b.id === id)?.hex ?? "#f3f0ea";
}

export function subjectMeta(id: SubjectId) {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

export function aspectMeta(id: AspectId) {
  return ASPECTS.find((a) => a.id === id) ?? ASPECTS[0];
}

export function presetMeta(id: PresetId) {
  return LIGHT_PRESETS.find((p) => p.id === id);
}

export function lightPosition(spec: LightSpec): [number, number, number] {
  const a = (spec.angle * Math.PI) / 180;
  return [Math.sin(a) * spec.distance, spec.height, Math.cos(a) * spec.distance];
}

export function mixHex(hex: string, toward: string, t: number): string {
  const parse = (value: string): [number, number, number] => {
    const h = value.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const a = parse(hex);
  const b = parse(toward);
  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
  return `#${mixed.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export const SHOTS_KEY = "lumen-roll-v1";
