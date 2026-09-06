import { useState, type DragEvent, type ReactNode } from "react";
import { ArrowLeft, Check, FileCode2, FilePlus2, Headphones, Upload, X } from "lucide-react";
import { toast } from "sonner";
import "../parser-panel.css";

type SourceKey = "baseScript" | "promptScript" | "audio";

type Source = {
  key: SourceKey;
  eyebrow: string;
  title: string;
  description: string;
  formats: string;
  accept: string;
  icon: ReactNode;
};

const sources: Source[] = [
  {
    key: "baseScript",
    eyebrow: "01 / DOCUMENT",
    title: "Base script",
    description: "The story's source of truth.",
    formats: "TXT, DOCX, PDF · narration or screenplay",
    accept: ".txt,.doc,.docx,.pdf",
    icon: <FileCode2 size={28} strokeWidth={1.6} />,
  },
  {
    key: "promptScript",
    eyebrow: "02 / DOCUMENT",
    title: "Script + prompt language",
    description: "Show the intelligence how you direct.",
    formats: "TXT, DOCX, PDF, JSON · script with scene prompts",
    accept: ".txt,.doc,.docx,.pdf,.json",
    icon: <FilePlus2 size={28} strokeWidth={1.6} />,
  },
  {
    key: "audio",
    eyebrow: "03 / AUDIO",
    title: "Master audio track",
    description: "The timing spine for every scene.",
    formats: "MP3, WAV, M4A, WEBM · matched narration",
    accept: "audio/mpeg,audio/wav,audio/x-m4a,audio/webm,.mp3,.wav,.m4a,.webm",
    icon: <Headphones size={28} strokeWidth={1.6} />,
  },
];

function DropZone({ source, file, onFile }: { source: Source; file: File | null; onFile: (file: File | null) => void }) {
  const [dragging, setDragging] = useState(false);

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) return;
    onFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      className={`source-dropzone ${dragging ? "source-dropzone--dragging" : ""} ${file ? "source-dropzone--filled" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
      onDrop={handleDrop}
    >
      <div className="source-dropzone__top">
        <span className="source-dropzone__icon">{source.icon}</span>
        <span className="source-dropzone__number">{source.eyebrow}</span>
      </div>
      <h2>{source.title}</h2>
      <p>{source.description}</p>
      <small>{source.formats}</small>
      {file ? (
        <div className="source-file" title={file.name}>
          <Check size={15} />
          <span>{file.name}</span>
          <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onFile(null)}><X size={15} /></button>
        </div>
      ) : (
        <label className="source-browse">
          <span>Drop file here</span>
          <span>Browse <Upload size={14} /></span>
          <input type="file" accept={source.accept} onChange={(event) => chooseFile(event.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}

export default function NewProject({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<Record<SourceKey, File | null>>({ baseScript: null, promptScript: null, audio: null });
  const [projectName, setProjectName] = useState("Untitled production");

  const allSourcesAdded = Object.values(files).every(Boolean);

  function setSource(key: SourceKey, file: File | null) {
    setFiles((current) => ({ ...current, [key]: file }));
  }

  function startProduction() {
    if (!allSourcesAdded) {
      toast.error("Add all three sources first", { description: "Base script, prompt language, and master audio are required." });
      return;
    }
    toast.success("Sources ready", { description: `${projectName || "Untitled production"} is ready for scene parsing.` });
  }

  return (
    <section className="new-project-page">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to dashboard</button>
      <div className="new-project-heading">
        <div>
          <p className="dashboard-eyebrow">NEW PROJECT / SOURCE MATERIAL</p>
          <h1>Bring your story into the studio.</h1>
          <p>Add the three source files Script2Cine uses to understand, direct, and time your production.</p>
        </div>
        <label className="project-name-field"><span>Project name</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="David & Goliath" /></label>
      </div>

      <div className="source-grid">
        {sources.map((source) => <DropZone key={source.key} source={source} file={files[source.key]} onFile={(file) => setSource(source.key, file)} />)}
      </div>

      <div className="audio-explainer">
        <div className="audio-explainer__mark"><Headphones size={18} /></div>
        <div><strong>Why the audio matters</strong><p>The parser uses the first script to understand the story, the second drop to learn your prompt style, and the audio track to anchor the final scene durations.</p></div>
      </div>

      <div className="new-project-footer">
        <span>{Object.values(files).filter(Boolean).length} of 3 sources added</span>
        <button className="dashboard-primary-button" type="button" onClick={startProduction}>Add all three sources <ArrowLeft size={16} className="button-arrow" /></button>
      </div>
    </section>
  );
}
