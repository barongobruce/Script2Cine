import { Check, Clipboard, ExternalLink, LoaderCircle, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export type GenerationJob = {
  id: string;
  sceneId: string;
  sceneNumber: number;
  provider: "google-flow";
  status: "queued" | "preparing" | "generating" | "complete" | "failed";
  prompt: string;
  outputUrl?: string;
  error?: string;
};

function statusLabel(status: GenerationJob["status"]) {
  return status === "preparing" ? "Preparing prompt" : status[0].toUpperCase() + status.slice(1);
}

export default function GenerationQueue({ jobs, canQueue, queueing, onQueue, onStatus }: { jobs: GenerationJob[]; canQueue: boolean; queueing: boolean; onQueue: () => void; onStatus: (jobId: string, status: GenerationJob["status"], outputUrl?: string) => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  async function copyPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    toast.success("Google Flow prompt copied");
  }

  return (
    <section className="generation-queue"><div className="generation-queue__header"><div><p className="dashboard-eyebrow">GOOGLE FLOW QUEUE</p><h2>Generate approved scenes.</h2><p>Script2Cine prepares prompts. Use them in Google Flow, then paste the resulting clip URL back here.</p></div><button className="dashboard-primary-button" type="button" disabled={!canQueue || queueing} onClick={onQueue}><Play size={15} /> {queueing ? "Preparing queue..." : "Queue approved scenes"}</button></div>{!jobs.length ? <div className="queue-empty"><LoaderCircle size={18} /><span>Approve at least one scene to create a Google Flow queue.</span></div> : <div className="job-list">{jobs.map((job) => <article className={`job-card job-card--${job.status}`} key={job.id}><div className="job-card__top"><div><span className="scene-card__number">SCENE {job.sceneNumber.toString().padStart(2, "0")}</span><strong>{statusLabel(job.status)}</strong></div><span className="job-provider">Google Flow</span></div><div className="job-card__actions"><button className="secondary-action-button" type="button" onClick={() => copyPrompt(job.prompt)}><Clipboard size={14} /> Copy Flow prompt</button>{job.outputUrl && <a className="secondary-action-button" href={job.outputUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View clip</a>}<select value={job.status} onChange={(event) => onStatus(job.id, event.target.value as GenerationJob["status"], job.outputUrl)} aria-label={`Status for scene ${job.sceneNumber}`}><option value="queued">Queued</option><option value="preparing">Preparing</option><option value="generating">Generating</option><option value="complete">Complete</option><option value="failed">Failed</option></select><input className="job-url-input" value={urls[job.id] || job.outputUrl || ""} onChange={(event) => setUrls((current) => ({ ...current, [job.id]: event.target.value }))} placeholder="Paste Flow clip URL" aria-label={`Flow clip URL for scene ${job.sceneNumber}`} /><button className="secondary-action-button" type="button" onClick={() => onStatus(job.id, "complete", urls[job.id] || job.outputUrl)}><Check size={14} /> Save clip URL</button>{job.status === "failed" && <button className="secondary-action-button" type="button" onClick={() => onStatus(job.id, "queued")}><RefreshCw size={14} /> Retry</button>}{job.status === "complete" && <span className="job-complete"><Check size={14} /> Done</span>}</div></article>)}</div>}</section>
  );
}
