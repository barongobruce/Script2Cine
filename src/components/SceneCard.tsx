import { Check, Save } from "lucide-react";

export type Scene = {
  id: string;
  sceneNumber: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  narration: string;
  visualPrompt: string;
  cameraPlan: string;
  mood: string;
  shotType?: string;
  cameraAngle?: string;
  pacing?: string;
  soundDesign?: string;
  transition?: string;
  visualModel?: string;
  approvalStatus?: "draft" | "approved" | "needs-review";
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function SceneCard({ scene, onChange }: { scene: Scene; onChange: (scene: Scene) => void }) {
  function update(field: keyof Scene, value: string) {
    onChange({ ...scene, [field]: value });
  }

  return (
    <article className={`scene-card scene-card--${scene.approvalStatus || "draft"}`}>
      <div className="scene-card__header"><div><span className="scene-card__number">SCENE {scene.sceneNumber.toString().padStart(2, "0")}</span><strong>{formatTime(scene.startTimeSeconds)} – {formatTime(scene.endTimeSeconds)}</strong></div><span className="scene-card__duration">{scene.durationSeconds.toFixed(1)}s / max 6s</span></div>
      <label><span>Narration</span><textarea value={scene.narration} onChange={(event) => update("narration", event.target.value)} rows={2} /></label>
      <label><span>Visual prompt</span><textarea value={scene.visualPrompt} onChange={(event) => update("visualPrompt", event.target.value)} rows={3} /></label>
      <div className="scene-card__fields"><label><span>Shot type</span><input value={scene.shotType || ""} onChange={(event) => update("shotType", event.target.value)} placeholder="Wide, close-up, OTS..." /></label><label><span>Camera angle / movement</span><input value={scene.cameraAngle || scene.cameraPlan} onChange={(event) => { update("cameraAngle", event.target.value); update("cameraPlan", event.target.value); }} placeholder="Slow dolly in, low angle..." /></label><label><span>Pacing</span><input value={scene.pacing || ""} onChange={(event) => update("pacing", event.target.value)} placeholder="Hold, cut on sentence..." /></label><label><span>Mood / lighting</span><input value={scene.mood} onChange={(event) => update("mood", event.target.value)} /></label><label><span>Sound design</span><input value={scene.soundDesign || ""} onChange={(event) => update("soundDesign", event.target.value)} placeholder="Silence, impact, ambience..." /></label><label><span>Transition</span><input value={scene.transition || "Invisible transition"} onChange={(event) => update("transition", event.target.value)} /></label><label><span>Visual model</span><input value={scene.visualModel || ""} onChange={(event) => update("visualModel", event.target.value)} placeholder="Cinematic realism" /></label></div>
      <div className="scene-card__footer"><span className={`scene-approval-badge scene-approval-badge--${scene.approvalStatus || "draft"}`}>{scene.approvalStatus === "approved" ? "Approved" : scene.approvalStatus === "needs-review" ? "Needs review" : "Draft"}</span><div><button className="scene-review-button" type="button" onClick={() => onChange({ ...scene, approvalStatus: "needs-review" })}>Needs review</button><button className="scene-approve-button" type="button" onClick={() => onChange({ ...scene, approvalStatus: "approved" })}><Check size={14} /> Approve scene</button></div></div>
      <button className="scene-save-hint" type="button" onClick={() => onChange(scene)}><Save size={14} /> Changes save with the project</button>
    </article>
  );
}
