import { useEffect, useState } from "react";
import { ArrowLeft, BrainCircuit, CheckCircle2, Clock3, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import SceneCard, { type Scene } from "../components/SceneCard";
import ProductionDirectionEditor, { type Direction } from "../components/ProductionDirection";
import GenerationQueue, { type GenerationJob } from "../components/GenerationQueue";
import TimelineAssembly, { type TimelineItem } from "../components/TimelineAssembly";
import RenderPanel, { type RenderJob } from "../components/RenderPanel";
import "../parser-panel.css";

type Project = {
  id: string;
  name: string;
  status: string;
  stage: string;
  progress: number;
  updatedAt: string;
  files?: { audio?: string };
  audioDurationSeconds?: number | null;
  scenes?: Scene[];
  direction: Direction;
  generationJobs?: GenerationJob[];
  timeline?: TimelineItem[];
  timelineApproved?: boolean;
  renderJob?: RenderJob;
  steps: { name: string; status: "complete" | "active" | "waiting"; detail: string }[];
};

function formatDuration(seconds?: number | null) {
  if (!seconds) return "Not detected";
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function ProjectDetail({ projectId, onBack, onUpdated }: { projectId: string; onBack: () => void; onUpdated?: (project: Project) => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDirection, setSavingDirection] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [preparingTimeline, setPreparingTimeline] = useState(false);
  const [savingTimeline, setSavingTimeline] = useState(false);

  async function loadProject() {
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Project could not be loaded");
      setProject(data.project);
      onUpdated?.(data.project);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProject(); const timer = window.setInterval(() => void loadProject(), 10000); return () => window.clearInterval(timer); }, [projectId]);

  async function analyze() {
    setAnalyzing(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/analyze`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scene analysis failed");
      setProject(data.project);
      onUpdated?.(data.project);
      toast.success("Scene analysis complete", { description: `${data.project.scenes?.length || 0} scenes are ready for direction.` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scene analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function changeScene(scene: Scene) {
    setProject((current) => current ? { ...current, scenes: current.scenes?.map((item) => item.id === scene.id ? scene : item) } : current);
  }

  async function saveScenes() {
    if (!project?.scenes) return;
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/scenes`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenes: project.scenes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scene changes could not be saved");
      setProject(data.project);
      onUpdated?.(data.project);
      toast.success("Scene plan saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scene changes could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function saveDirection() {
    if (!project) return;
    setSavingDirection(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/direction`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project.direction) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Production direction could not be saved");
      setProject(data.project);
      onUpdated?.(data.project);
      toast.success("Production direction saved", { description: "The dashboard pipeline has been updated." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Production direction could not be saved");
    } finally {
      setSavingDirection(false);
    }
  }

  async function queueApprovedScenes() {
    setQueueing(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/generation-queue`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation queue could not be created");
      setProject(data.project);
      onUpdated?.(data.project);
      toast.success("Automatic generation started", { description: `${data.jobs.length} approved scene jobs are ready.` });
      await Promise.all(data.jobs.filter((job: GenerationJob) => job.status === "queued").map((job: GenerationJob) => startGeneration(job.id)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation queue could not be created");
    } finally {
      setQueueing(false);
    }
  }

  async function startGeneration(jobId: string) {
    const response = await fetch(`http://localhost:4000/api/projects/${projectId}/generation-jobs/${jobId}/generate`, { method: "POST" });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Automatic generation could not start"); }
  }

  async function retryAllFailed() {
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/generation-jobs/retry-failed`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed scenes could not be queued");
      setProject(data.project); onUpdated?.(data.project);
      await Promise.all(data.jobIds.map((jobId: string) => startGeneration(jobId)));
      toast.success("Failed scenes queued for retry");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed scenes could not be retried"); }
  }

  async function cancelGeneration(jobId: string) {
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/generation-jobs/${jobId}/cancel`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation could not be cancelled");
      setProject(data.project); onUpdated?.(data.project); toast.success("Generation cancellation requested");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Generation could not be cancelled"); }
  }

  async function prepareTimeline() {
    setPreparingTimeline(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/timeline/prepare`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Timeline could not be prepared");
      setProject(data.project); onUpdated?.(data.project); toast.success("Timeline prepared", { description: `${data.project.timeline?.length || 0} clips are on the narration timeline.` });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Timeline could not be prepared"); }
    finally { setPreparingTimeline(false); }
  }

  async function saveTimeline(timelineApproved: boolean) {
    if (!project?.timeline) return;
    setSavingTimeline(true);
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${projectId}/timeline`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timeline: project.timeline, timelineApproved }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Timeline could not be saved");
      setProject(data.project); onUpdated?.(data.project); toast.success(timelineApproved ? "Timeline approved for render" : "Timeline changes saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Timeline could not be saved"); }
    finally { setSavingTimeline(false); }
  }

  function approveAll() {
    setProject((current) => current ? { ...current, scenes: current.scenes?.map((scene) => ({ ...scene, approvalStatus: "approved" as const })) } : current);
  }

  if (loading) return <section className="project-detail-page"><LoaderCircle className="spin" /> Loading project...</section>;
  if (!project) return <section className="project-detail-page"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back</button><h1>Project not found</h1></section>;

  const approvedCount = project.scenes?.filter((scene) => scene.approvalStatus === "approved").length || 0;

  return (
    <section className="project-detail-page">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to dashboard</button>
      <div className="project-detail-heading"><div><p className="dashboard-eyebrow">PROJECT / PRODUCTION PLAN</p><h1>{project.name}</h1><p>Teach the production language, then approve the scene plan before visual generation.</p></div><button className="dashboard-primary-button" type="button" onClick={analyze} disabled={analyzing}><BrainCircuit size={16} /> {analyzing ? "Analyzing scenes..." : project.scenes?.length ? "Re-analyze scenes" : "Analyze scenes"}</button></div>
      <div className="project-detail-summary"><div><Clock3 size={17} /><span><small>MASTER AUDIO</small><strong>{formatDuration(project.audioDurationSeconds)}</strong></span></div><div><CheckCircle2 size={17} /><span><small>PIPELINE STAGE</small><strong>{project.steps.find((step) => step.status === "active")?.name || "Complete"}</strong></span></div><div><BrainCircuit size={17} /><span><small>SCENES APPROVED</small><strong>{approvedCount} / {project.scenes?.length || 0}</strong></span></div><div><span><small>PROGRESS</small><strong>{project.progress}%</strong></span></div></div>
      <ProductionDirectionEditor direction={project.direction} onChange={(direction: Direction) => setProject((current) => current ? { ...current, direction } : current)} onSave={saveDirection} saving={savingDirection} />
      <GenerationQueue jobs={project.generationJobs || []} canQueue={Boolean(project.scenes?.some((scene) => scene.approvalStatus === "approved"))} queueing={queueing} onQueue={queueApprovedScenes} onGenerate={(jobId) => void startGeneration(jobId).catch((error) => toast.error(error instanceof Error ? error.message : "Automatic generation could not start"))} onRetryAll={() => void retryAllFailed()} onCancel={(jobId) => void cancelGeneration(jobId)} />
      <TimelineAssembly timeline={project.timeline || []} approved={Boolean(project.timelineApproved)} canPrepare={Boolean(project.generationJobs?.some((job) => job.status === "complete" && job.outputUrl))} preparing={preparingTimeline} saving={savingTimeline} onPrepare={prepareTimeline} onChange={(timeline) => setProject((current) => current ? { ...current, timeline, timelineApproved: false } : current)} onSave={saveTimeline} />
      <RenderPanel projectId={projectId} renderJob={project.renderJob} canRender={Boolean(project.timelineApproved && project.timeline?.length && project.files?.audio)} onRendered={(_renderJob, updatedProject) => { setProject(updatedProject as Project); onUpdated?.(updatedProject as Project); }} />
      {project.scenes?.length ? <div className="scene-plan-header"><div><p className="dashboard-eyebrow">EDITABLE SCENE PLAN</p><h2>Approve the shots before generation.</h2></div><div className="scene-plan-actions"><button className="secondary-action-button" type="button" onClick={approveAll}>Approve all scenes</button><button className="secondary-action-button" type="button" onClick={saveScenes} disabled={saving}><Save size={15} /> {saving ? "Saving..." : "Save scene plan"}</button></div></div> : <div className="analysis-empty"><BrainCircuit size={22} /><div><strong>Your scene plan is waiting.</strong><p>Analyze the uploaded sources to extract narration beats, camera direction, timing, and audio relationships.</p></div></div>}
      <div className="scene-list">{project.scenes?.map((scene) => <SceneCard key={scene.id} scene={scene} onChange={changeScene} />)}</div>
    </section>
  );
}

