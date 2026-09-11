import { Check, Clipboard, ExternalLink, LoaderCircle, Play, RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";

export type GenerationJob = {
  id: string;
  sceneId: string;
  sceneNumber: number;
  provider: "google-flow" | "google-veo";
  status: "queued" | "preparing" | "submitting" | "generating" | "downloading" | "complete" | "failed" | "cancelled";
  prompt: string;
  progress?: number;
  progressDetail?: string;
  outputUrl?: string;
  localFilePath?: string;
  error?: string;
};

function statusLabel(job: GenerationJob) {
  if (job.status === "submitting") return "Submitting to Veo";
  if (job.status === "generating") return "Generating";
  if (job.status === "downloading") return "Downloading";
  if (job.status === "complete") return "Downloaded";
  if (job.status === "cancelled") return "Cancelled";
  return job.status[0].toUpperCase() + job.status.slice(1);
}

export default function GenerationQueue({ jobs, canQueue, queueing, onQueue, onGenerate, onRetryAll, onCancel }: { jobs: GenerationJob[]; canQueue: boolean; queueing: boolean; onQueue: () => void; onGenerate: (jobId: string) => void; onRetryAll: () => void; onCancel: (jobId: string) => void }) {
  const activeJobs = jobs.filter((job) => ["preparing", "submitting", "generating", "downloading"].includes(job.status));
  const failedJobs = jobs.filter((job) => job.status === "failed" || job.status === "cancelled");
  async function copyPrompt(prompt: string) { await navigator.clipboard.writeText(prompt); toast.success("Veo prompt copied"); }
  return <section className="generation-queue"><div className="generation-queue__header"><div><p className="dashboard-eyebrow">AUTOMATIC VEO GENERATION</p><h2>Generate approved scenes.</h2><p>Completed scenes are retained. Failed scenes can be retried without regenerating successful clips.</p></div><div className="generation-queue__header-actions"><button className="dashboard-primary-button" type="button" disabled={!canQueue || queueing} onClick={onQueue}><Play size={15} /> {queueing ? "Starting generation..." : "Generate approved scenes"}</button>{failedJobs.length > 0 && <button className="secondary-action-button" type="button" onClick={onRetryAll}><RefreshCw size={14} /> Retry failed ({failedJobs.length})</button>}</div></div>{activeJobs.length > 0 && <div className="generation-summary"><LoaderCircle className="spin" size={16} /> {activeJobs.length} scene{activeJobs.length === 1 ? "" : "s"} processing. The dashboard will update automatically.</div>}{!jobs.length ? <div className="queue-empty"><LoaderCircle size={18} /><span>Approve at least one scene to start automatic generation.</span></div> : <div className="job-list">{jobs.map((job) => <article className={`job-card job-card--${job.status}`} key={job.id}><div className="job-card__top"><div><span className="scene-card__number">SCENE {job.sceneNumber.toString().padStart(2, "0")}</span><strong>{statusLabel(job)}</strong></div><span className="job-provider">{job.provider === "google-veo" ? "Google Veo API" : "Legacy Flow job"}</span></div><div className="job-progress"><span style={{ width: `${Math.max(0, Math.min(100, job.progress || 0))}%` }} /><b>{job.progress || 0}%</b></div><p className="job-progress-detail">{job.progressDetail || job.error || "Waiting to start"}</p><div className="job-card__actions"><button className="secondary-action-button" type="button" onClick={() => copyPrompt(job.prompt)}><Clipboard size={14} /> Copy prompt</button>{job.outputUrl && <a className="secondary-action-button" href={job.outputUrl.startsWith("/") ? `http://localhost:4000${job.outputUrl}` : job.outputUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View MP4</a>}{job.status === "queued" && <button className="secondary-action-button" type="button" onClick={() => onGenerate(job.id)}><Play size={14} /> Start</button>}{job.status === "failed" || job.status === "cancelled" ? <button className="secondary-action-button" type="button" onClick={() => onGenerate(job.id)}><RefreshCw size={14} /> Retry</button> : null}{["preparing", "submitting", "generating", "downloading"].includes(job.status) && <button className="secondary-action-button" type="button" onClick={() => onCancel(job.id)}><Square size={14} /> Cancel</button>}{job.status === "complete" && <span className="job-complete"><Check size={14} /> Downloaded</span>}</div></article>)}</div>}</section>;
}
