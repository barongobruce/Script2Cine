import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export type CharacterProfile = {
  id: string;
  name: string;
  physicalFeatures: string;
  wardrobe: string;
  props: string;
  continuityNotes: string;
};

export type Direction = {
  visualStyle: string;
  aspectRatio: string;
  defaultCameraLanguage: string;
  colorPalette: string;
  lighting: string;
  pacingRules: string;
  audioRules: string;
  maxClipSeconds: number;
  defaultVideoModel: string;
  cameraRules: string;
  soundRules: string;
  continuityRules: string;
  characters: CharacterProfile[];
};

const fields: { key: keyof Omit<Direction, "characters" | "maxClipSeconds">; label: string; rows?: number }[] = [
  { key: "visualStyle", label: "Visual style" },
  { key: "defaultCameraLanguage", label: "Default camera language" },
  { key: "colorPalette", label: "Color palette" },
  { key: "lighting", label: "Lighting" },
  { key: "pacingRules", label: "Pacing rules", rows: 3 },
  { key: "audioRules", label: "Audio synchronization rules", rows: 3 },
  { key: "cameraRules", label: "Camera movement rules", rows: 3 },
  { key: "soundRules", label: "Sound and transition rules", rows: 3 },
  { key: "continuityRules", label: "Continuity and footage rules", rows: 3 },
];

export default function ProductionDirectionEditor({ direction, onChange, onSave, saving }: { direction: Direction; onChange: (direction: Direction) => void; onSave: () => void; saving: boolean }) {
  const [open, setOpen] = useState(true);

  function update(field: keyof Direction, value: string | number) {
    onChange({ ...direction, [field]: value });
  }

  function updateCharacter(id: string, field: keyof CharacterProfile, value: string) {
    onChange({ ...direction, characters: direction.characters.map((character) => character.id === id ? { ...character, [field]: value } : character) });
  }

  function addCharacter() {
    onChange({ ...direction, characters: [...direction.characters, { id: crypto.randomUUID(), name: "New character", physicalFeatures: "", wardrobe: "", props: "", continuityNotes: "" }] });
  }

  return (
    <section className="direction-panel">
      <div className="direction-panel__header"><div><p className="dashboard-eyebrow">PRODUCTION DIRECTION</p><h2>Teach Script2Cine how you direct.</h2><p>These rules become defaults for every scene. Individual scene cards can override them.</p></div><div className="direction-panel__actions"><button className="secondary-action-button" type="button" onClick={() => setOpen((value) => !value)}>{open ? "Collapse" : "Expand"}</button><button className="dashboard-primary-button" type="button" onClick={onSave} disabled={saving}><Save size={15} /> {saving ? "Saving..." : "Save direction"}</button></div></div>
      {open && <>
        <div className="direction-grid">
          {fields.map((field) => <label key={field.key}><span>{field.label}</span>{field.rows ? <textarea rows={field.rows} value={String(direction[field.key])} onChange={(event) => update(field.key, event.target.value)} /> : <input value={String(direction[field.key])} onChange={(event) => update(field.key, event.target.value)} />}</label>)}
          <label><span>Aspect ratio</span><select value={direction.aspectRatio} onChange={(event) => update("aspectRatio", event.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option></select></label>
          <label><span>Default video model</span><input value={direction.defaultVideoModel} onChange={(event) => update("defaultVideoModel", event.target.value)} placeholder="Cinematic realism" /></label>
          <label><span>Maximum generated clip seconds</span><input type="number" min={1} max={6} value={direction.maxClipSeconds} onChange={(event) => update("maxClipSeconds", Math.min(6, Math.max(1, Number(event.target.value) || 6)))} /></label>
        </div>
        <div className="character-section"><div className="character-section__header"><div><p className="dashboard-eyebrow">CHARACTER CONTINUITY</p><h3>Keep faces, bodies, wardrobe, and props consistent.</h3></div><button className="secondary-action-button" type="button" onClick={addCharacter}><Plus size={15} /> Add character</button></div><div className="character-grid">{direction.characters.map((character) => <article className="character-card" key={character.id}><div className="character-card__title"><input value={character.name} onChange={(event) => updateCharacter(character.id, "name", event.target.value)} /><button type="button" aria-label={`Remove ${character.name}`} onClick={() => onChange({ ...direction, characters: direction.characters.filter((item) => item.id !== character.id) })}><Trash2 size={15} /></button></div><label><span>Physical features</span><textarea rows={3} value={character.physicalFeatures} onChange={(event) => updateCharacter(character.id, "physicalFeatures", event.target.value)} placeholder="Face, hair, age, body type..." /></label><label><span>Wardrobe</span><textarea rows={2} value={character.wardrobe} onChange={(event) => updateCharacter(character.id, "wardrobe", event.target.value)} /></label><label><span>Props</span><input value={character.props} onChange={(event) => updateCharacter(character.id, "props", event.target.value)} /></label><label><span>Continuity notes</span><textarea rows={2} value={character.continuityNotes} onChange={(event) => updateCharacter(character.id, "continuityNotes", event.target.value)} /></label></article>)}</div></div>
      </>}
    </section>
  );
}
