import { Component, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Aperture, Download, Grid3x3, RotateCcw, Sun, Trash2, X } from "lucide-react";
import {
  ASPECTS,
  BACKDROPS,
  GELS,
  LIGHT_PRESETS,
  SHOTS_KEY,
  SUBJECTS,
  aspectMeta,
  presetMeta,
  subjectMeta,
  type AspectId,
  type GelId,
  type LightSpec,
  type Shot,
  type SubjectId,
} from "./data";
import { cropToFrame, downloadShot, shutterSound } from "./capture";
import { useStudio } from "./store";

class WebGLBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || "WebGL failed to start" };
  }

  render() {
    if (this.state.message) {
      return (
        <div className="grid h-full place-items-center px-6 text-center">
          <div>
            <p className="font-display text-2xl italic text-fg">The studio needs WebGL</p>
            <p className="mt-2 max-w-sm text-sm text-muted">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function StudioViewport() {
  const [Scene, setScene] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void import("./scene")
      .then((mod) => {
        if (live) setScene(() => mod.StudioScene);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <p className="font-display text-2xl italic text-fg">The lamps would not strike</p>
      </div>
    );
  }
  if (!Scene) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl italic text-fg">Warming the lamps</p>
          <p className="mt-2 text-sm text-muted">The cyclorama is coming up.</p>
        </div>
      </div>
    );
  }
  return (
    <WebGLBoundary>
      <Scene />
    </WebGLBoundary>
  );
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Field({
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col">
      <span className="flex items-baseline justify-between gap-3 text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{display}</span>
      </span>
      <input
        className="studio-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function GelRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: GelId;
  onChange: (gel: GelId) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label} gel</p>
      <div className="mt-1 flex flex-wrap">
        {GELS.map((gel) => (
          <button
            key={gel.id}
            type="button"
            aria-label={`${label} ${gel.name}`}
            aria-pressed={value === gel.id}
            onClick={() => onChange(gel.id)}
            className="grid size-11 place-items-center rounded-full"
          >
            <span
              className={cx(
                "size-5 rounded-full border",
                value === gel.id ? "border-accent" : "border-line",
              )}
              style={{ background: gel.hex }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function LightBlock({
  title,
  spec,
  onPatch,
  onGel,
}: {
  title: string;
  spec: LightSpec;
  onPatch: (patch: Partial<LightSpec>) => void;
  onGel: (gel: GelId) => void;
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-4">
      <h2 className="text-xs tracking-widest text-muted uppercase">{title}</h2>
      <Field
        label="Intensity"
        value={spec.intensity}
        min={0}
        max={260}
        step={1}
        display={String(Math.round(spec.intensity))}
        onChange={(intensity) => onPatch({ intensity })}
      />
      <Field
        label="Angle"
        value={spec.angle}
        min={-180}
        max={180}
        step={1}
        display={`${Math.round(spec.angle)}°`}
        onChange={(angle) => onPatch({ angle })}
      />
      <Field
        label="Height"
        value={spec.height}
        min={0.6}
        max={5}
        step={0.05}
        display={spec.height.toFixed(1)}
        onChange={(height) => onPatch({ height })}
      />
      <GelRow label={title} value={spec.gel} onChange={onGel} />
    </section>
  );
}

function Controls() {
  const presetId = useStudio((s) => s.presetId);
  const backdropId = useStudio((s) => s.backdropId);
  const exposure = useStudio((s) => s.exposure);
  const focal = useStudio((s) => s.focal);
  const floorGloss = useStudio((s) => s.floorGloss);
  const aspectId = useStudio((s) => s.aspectId);
  const key = useStudio((s) => s.key);
  const fill = useStudio((s) => s.fill);
  const rim = useStudio((s) => s.rim);
  const yaw = useStudio((s) => s.yaw);
  const autoSpin = useStudio((s) => s.autoSpin);
  const spinSpeed = useStudio((s) => s.spinSpeed);
  const showGuides = useStudio((s) => s.showGuides);
  const thirds = useStudio((s) => s.thirds);
  const applyPreset = useStudio((s) => s.applyPreset);
  const setBackdrop = useStudio((s) => s.setBackdrop);
  const setExposure = useStudio((s) => s.setExposure);
  const setFocal = useStudio((s) => s.setFocal);
  const setFloorGloss = useStudio((s) => s.setFloorGloss);
  const patchLight = useStudio((s) => s.patchLight);
  const setLightGel = useStudio((s) => s.setLightGel);
  const setYaw = useStudio((s) => s.setYaw);
  const setAutoSpin = useStudio((s) => s.setAutoSpin);
  const setSpinSpeed = useStudio((s) => s.setSpinSpeed);
  const setShowGuides = useStudio((s) => s.setShowGuides);
  const setThirds = useStudio((s) => s.setThirds);
  const setAspect = useStudio((s) => s.setAspect);
  const bumpCamera = useStudio((s) => s.bumpCamera);

  return (
    <div className="flex flex-col gap-4 p-4">
      <section>
        <h2 className="text-xs tracking-widest text-muted uppercase">Looks</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {LIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={presetId === preset.id}
              onClick={() => applyPreset(preset.id)}
              className={cx(
                "min-h-11 rounded-full px-3 text-sm",
                presetId === preset.id ? "bg-accent text-accent-ink" : "bg-bg text-fg",
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{presetMeta(presetId)?.note ?? "Your own mix."}</p>
      </section>

      <section className="border-t border-line pt-4">
        <h2 className="text-xs tracking-widest text-muted uppercase">Backdrop</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {BACKDROPS.map((drop) => (
            <button
              key={drop.id}
              type="button"
              aria-pressed={backdropId === drop.id}
              aria-label={drop.name}
              onClick={() => setBackdrop(drop.id)}
              className="flex min-h-11 flex-col items-center justify-center gap-1"
            >
              <span
                className={cx(
                  "size-6 rounded-full border",
                  backdropId === drop.id ? "border-accent" : "border-line",
                )}
                style={{ background: drop.hex }}
              />
              <span className="text-xs text-muted">{drop.name}</span>
            </button>
          ))}
        </div>
      </section>

      <LightBlock title="Key" spec={key} onPatch={(patch) => patchLight("key", patch)} onGel={(gel) => setLightGel("key", gel)} />

      <section className="flex flex-col gap-2 border-t border-line pt-4">
        <h2 className="text-xs tracking-widest text-muted uppercase">Lens</h2>
        <Field
          label="Focal length"
          value={focal}
          min={24}
          max={135}
          step={1}
          display={`${Math.round(focal)} mm`}
          onChange={setFocal}
        />
        <Field
          label="Exposure"
          value={exposure}
          min={0.45}
          max={1.6}
          step={0.01}
          display={exposure.toFixed(2)}
          onChange={setExposure}
        />
        <div className="grid grid-cols-4 gap-1 rounded-md bg-bg p-1" role="group" aria-label="Aspect ratio">
          {ASPECTS.map((aspect) => (
            <button
              key={aspect.id}
              type="button"
              aria-pressed={aspectId === aspect.id}
              onClick={() => setAspect(aspect.id)}
              className={cx(
                "min-h-11 rounded-sm text-sm",
                aspectId === aspect.id ? "bg-accent text-accent-ink" : "text-muted",
              )}
            >
              {aspect.label}
            </button>
          ))}
        </div>
        <Field
          label="Floor sheen"
          value={floorGloss}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(floorGloss * 100)}%`}
          onChange={setFloorGloss}
        />
        <Field
          label="Turntable"
          value={(yaw * 180) / Math.PI}
          min={-180}
          max={180}
          step={1}
          display={autoSpin ? "Spinning" : `${Math.round((yaw * 180) / Math.PI)}°`}
          disabled={autoSpin}
          onChange={(degrees) => setYaw((degrees * Math.PI) / 180)}
        />
        <button
          type="button"
          aria-pressed={autoSpin}
          onClick={() => setAutoSpin(!autoSpin)}
          className="flex min-h-11 items-center justify-between rounded-md border border-line bg-bg px-3 text-sm"
        >
          <span>Auto spin</span>
          <span className={cx("rounded-full px-2 py-1 text-xs", autoSpin ? "bg-accent text-accent-ink" : "text-muted")}>
            {autoSpin ? "On" : "Off"}
          </span>
        </button>
        <Field
          label="Spin speed"
          value={spinSpeed}
          min={0.15}
          max={1.3}
          step={0.05}
          display={spinSpeed.toFixed(2)}
          onChange={setSpinSpeed}
        />
        <button
          type="button"
          aria-pressed={thirds}
          onClick={() => setThirds(!thirds)}
          className="flex min-h-11 items-center justify-between rounded-md border border-line bg-bg px-3 text-sm"
        >
          <span>Thirds grid</span>
          <span className={cx("rounded-full px-2 py-1 text-xs", thirds ? "bg-accent text-accent-ink" : "text-muted")}>
            {thirds ? "On" : "Off"}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={showGuides}
          onClick={() => setShowGuides(!showGuides)}
          className="flex min-h-11 items-center justify-between rounded-md border border-line bg-bg px-3 text-sm"
        >
          <span>Show lamps</span>
          <span className={cx("rounded-full px-2 py-1 text-xs", showGuides ? "bg-accent text-accent-ink" : "text-muted")}>
            {showGuides ? "On" : "Off"}
          </span>
        </button>
        <button
          type="button"
          onClick={bumpCamera}
          className="min-h-11 rounded-md border border-line bg-bg px-3 text-sm text-fg"
        >
          Reset view
        </button>
      </section>

      <LightBlock title="Fill" spec={fill} onPatch={(patch) => patchLight("fill", patch)} onGel={(gel) => setLightGel("fill", gel)} />
      <LightBlock title="Rim" spec={rim} onPatch={(patch) => patchLight("rim", patch)} onGel={(gel) => setLightGel("rim", gel)} />
    </div>
  );
}

function SubjectButton({ id, compact }: { id: SubjectId; compact?: boolean }) {
  const subjectId = useStudio((s) => s.subjectId);
  const setSubject = useStudio((s) => s.setSubject);
  const meta = subjectMeta(id);
  const active = subjectId === id;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => setSubject(id)}
      className={cx(
        "min-h-11 shrink-0 border-l-2 px-3 py-2 text-left",
        compact ? "rounded-md border" : "w-full",
        active
          ? "border-accent bg-surface text-fg"
          : "border-transparent text-muted hover:bg-surface hover:text-fg",
        compact && !active && "border-line",
      )}
    >
      <span className="block text-sm">{meta.name}</span>
      <span className="block text-xs text-muted">{meta.note}</span>
    </button>
  );
}

export function StudioShell() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState(false);
  const [flash, setFlash] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subjectId = useStudio((s) => s.subjectId);
  const focal = useStudio((s) => s.focal);
  const aspectId = useStudio((s) => s.aspectId);
  const presetId = useStudio((s) => s.presetId);
  const thirds = useStudio((s) => s.thirds);
  const ready = useStudio((s) => s.ready);
  const shots = useStudio((s) => s.shots);
  const setThirds = useStudio((s) => s.setThirds);
  const cycleAspect = useStudio((s) => s.cycleAspect);
  const stepSubject = useStudio((s) => s.stepSubject);
  const addShot = useStudio((s) => s.addShot);
  const removeShot = useStudio((s) => s.removeShot);

  const subject = subjectMeta(subjectId);
  const aspect = aspectMeta(aspectId);
  const open = shots.find((shot) => shot.id === openId) ?? null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHOTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Shot[];
      if (!Array.isArray(parsed)) return;
      const shotsNext = parsed.filter((shot) => shot && typeof shot.url === "string" && typeof shot.id === "string").slice(0, 8);
      useStudio.setState({ shots: shotsNext });
    } catch {
      /* ignore a broken roll */
    }
  }, []);

  async function take() {
    const state = useStudio.getState();
    const frame = frameRef.current;
    const canvas = document.querySelector("canvas");
    if (!state.capture || !frame || !(canvas instanceof HTMLCanvasElement) || busy) return;
    setBusy(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
    shutterSound();
    try {
      const raw = state.capture();
      const url = await cropToFrame(raw, canvas, frame);
      const shot: Shot = {
        id: crypto.randomUUID(),
        url,
        subjectId: state.subjectId,
        focal: Math.round(state.focal),
        aspectId: state.aspectId,
        presetId: state.presetId,
        at: Date.now(),
      };
      addShot(shot);
    } catch {
      /* keep the studio usable if a frame fails */
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (openId) {
        if (event.key === "Escape") setOpenId(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          const index = shots.findIndex((shot) => shot.id === openId);
          if (index < 0) return;
          const next = shots[(index + (event.key === "ArrowRight" ? 1 : -1) + shots.length) % shots.length];
          if (next) setOpenId(next.id);
        }
        return;
      }
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        void take();
      }
      if (event.key === "ArrowRight") stepSubject(1);
      if (event.key === "ArrowLeft") stepSubject(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const frameStyle =
    aspect.ratio >= 1.2
      ? { width: "min(90%, 980px)", aspectRatio: String(aspect.ratio) }
      : { height: "90%", aspectRatio: String(aspect.ratio) };

  return (
    <main className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          <h1 className="font-display text-2xl leading-none italic text-fg">Lumen</h1>
        </div>
        <p className="hidden text-sm text-muted md:block">Light it. Frame it. Keep it.</p>
        <p className="text-sm tabular-nums text-fg">Roll {String(shots.length).padStart(2, "0")}</p>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-36 shrink-0 flex-col overflow-y-auto border-r border-line py-2 md:flex">
          {SUBJECTS.map((item) => (
            <SubjectButton key={item.id} id={item.id} />
          ))}
        </aside>

        <section className="relative min-w-0 flex-1 bg-bg">
          <div className="absolute inset-0">
            <StudioViewport />
          </div>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-3 left-3 rounded-md bg-bg/85 px-3 py-2">
              <p className="font-display text-xl leading-none italic text-fg">{subject.name}</p>
              <p className="mt-1 text-xs tracking-widest text-muted uppercase tabular-nums">
                {Math.round(focal)} mm · {presetMeta(presetId)?.name ?? "Custom"}
              </p>
            </div>
            <div className="pointer-events-auto absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                aria-label="Toggle thirds grid"
                aria-pressed={thirds}
                onClick={() => setThirds(!thirds)}
                className={cx(
                  "grid size-11 place-items-center rounded-full border",
                  thirds ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg/85 text-fg",
                )}
              >
                <Grid3x3 className="size-5" />
              </button>
              <button
                type="button"
                aria-label={`Aspect ${aspect.label}, tap to change`}
                onClick={cycleAspect}
                className="grid h-11 min-w-11 place-items-center rounded-full border border-line bg-bg/85 px-3 text-xs text-fg tabular-nums"
              >
                {aspect.label}
              </button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div ref={frameRef} className="finder-frame relative" style={frameStyle}>
                {thirds ? (
                  <div className="absolute inset-0" aria-hidden>
                    <div className="finder-line absolute inset-y-0 left-1/3 w-px" />
                    <div className="finder-line absolute inset-y-0 left-2/3 w-px" />
                    <div className="finder-line absolute inset-x-0 top-1/3 h-px" />
                    <div className="finder-line absolute inset-x-0 top-2/3 h-px" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {flash ? <div className="lumen-flash pointer-events-none absolute inset-0" aria-hidden /> : null}
          {sheet ? (
            <div className="absolute inset-x-0 bottom-0 z-20 flex h-1/2 flex-col border-t border-line bg-surface lg:hidden">
              <div className="flex items-center justify-between px-4 pt-3">
                <p className="text-sm text-fg">Lights and lens</p>
                <button type="button" aria-label="Close controls" onClick={() => setSheet(false)} className="grid size-11 place-items-center">
                  <X className="size-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Controls />
              </div>
            </div>
          ) : null}
        </section>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-surface lg:block">
          <Controls />
        </aside>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
        {SUBJECTS.map((item) => (
          <SubjectButton key={item.id} id={item.id} compact />
        ))}
      </div>

      <footer className="flex shrink-0 items-center gap-3 border-t border-line px-3 py-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {shots.length === 0 ? (
            <p className="text-sm text-muted">
              <span className="font-display text-lg italic">The roll is empty.</span>
              <span className="hidden sm:inline"> Drag to orbit, then shoot.</span>
            </p>
          ) : (
            <div className="flex gap-2">
              {shots.map((shot) => (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => setOpenId(shot.id)}
                  className={cx(
                    "h-16 shrink-0 overflow-hidden rounded-sm border",
                    openId === shot.id ? "border-accent" : "border-line",
                  )}
                  aria-label={`Open ${subjectMeta(shot.subjectId).name} frame`}
                >
                  <img src={shot.url} alt="" className="h-16 w-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSheet((value) => !value)}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg lg:hidden"
          aria-label="Lights and lens"
          aria-pressed={sheet}
        >
          <Sun className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => void take()}
          disabled={!ready || busy}
          aria-label="Take photo"
          className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-fg bg-bg disabled:opacity-40"
        >
          <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-ink">
            <Aperture className="size-6" />
          </span>
        </button>
        <button
          type="button"
          aria-label="Reset camera"
          onClick={() => useStudio.getState().bumpCamera()}
          className="hidden size-11 shrink-0 place-items-center rounded-full border border-line text-fg sm:grid"
        >
          <RotateCcw className="size-5" />
        </button>
      </footer>

      {open ? (
        <div
          className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-bg/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Saved frame"
        >
          <img
            src={open.url}
            alt={`${subjectMeta(open.subjectId).name} studio photograph`}
            className="max-h-[68dvh] max-w-full rounded-md object-contain"
          />
          <p className="text-sm text-muted tabular-nums">
            {subjectMeta(open.subjectId).name} · {open.focal} mm · {presetMeta(open.presetId)?.name ?? "Custom"} · {open.aspectId}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                downloadShot(open.url, `lumen-${open.subjectId}-${open.focal}mm.jpg`)
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm text-accent-ink"
            >
              <Download className="size-4" />
              Download
            </button>
            <button
              type="button"
              onClick={() => {
                removeShot(open.id);
                setOpenId(null);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg"
            >
              <X className="size-4" />
              Close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
