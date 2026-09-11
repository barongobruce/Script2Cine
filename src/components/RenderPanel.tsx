import { CheckCircle2, Download, Film, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type RenderJob = { id: string; status: "queued" | "preparing" | "complete" | "failed"; settings: { aspectRatio: string; width: number; height: number; frameRate: number; format: "mp4"; includeCaptions: boolean }; outputUrl?: string; error?: string };

export default function RenderPanel({ projectId, renderJob, canRender, onRendered }: { projectId: string; renderJob?: RenderJob; canRender: boolean; onRendered: (job: RenderJob, project: unknown) => void }) {
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({ aspectRatio: "16:9", width: 1920, height: 1080, frameRate: 24, includeCaptions: true });
  async function render() {
    setBusy(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/render`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Render preparation failed");
      onRendered(data.renderJob, data.project); toast.success("Render manifest ready", { description: "The timeline is validated and ready for the MP4 encoding stage." });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Render preparation failed"); }
    finally { setBusy(false); }
  }
  return <section className="render-panel"><div className="render-panel__header"><div><p className="dashboard-eyebrow">FINAL RENDER / EXPORT</p><h2>Prepare the finished cinematic export.</h2><p>Validate the approved timeline, audio, captions, and clip URLs before MP4 encoding.</p></div><Film size={25} /></div><div className="render-settings"><label>Aspect ratio<select value={settings.aspectRatio} onChange={(event) => setSettings((current) => ({ ...current, aspectRatio: event.target.value }))}><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label>Width<input type="number" min="640" value={settings.width} onChange={(event) => setSettings((current) => ({ ...current, width: Number(event.target.value) }))} /></label><label>Height<input type="number" min="640" value={settings.height} onChange={(event) => setSettings((current) => ({ ...current, height: Number(event.target.value) }))} /></label><label>Frame rate<select value={settings.frameRate} onChange={(event) => setSettings((current) => ({ ...current, frameRate: Number(event.target.value) }))}><option value="24">24 fps</option><option value="30">30 fps</option></select></label><label className="render-check"><input type="checkbox" checked={settings.includeCaptions} onChange={(event) => setSettings((current) => ({ ...current, includeCaptions: event.target.checked }))} /> Include captions</label></div>{renderJob?.status === "complete" && renderJob.outputUrl ? <div className="render-success"><CheckCircle2 size={20} /><div><strong>Render manifest ready</strong><span>MP4 target · {renderJob.settings.width} × {renderJob.settings.height} · {renderJob.settings.frameRate} fps</span></div><a className="dashboard-primary-button" href={`http://localhost:4000${renderJob.outputUrl}`} download><Download size={15} /> Download manifest</a></div> : <button className="dashboard-primary-button" type="button" disabled={!canRender || busy} onClick={render}>{busy ? <><LoaderCircle className="spin" size={15} /> Preparing manifest...</> : <><Film size={15} /> Prepare render manifest</>}</button>}{!canRender && !renderJob && <p className="render-hint">Approve the timeline and complete every validation item before preparing the render manifest.</p>}</section>;
}
