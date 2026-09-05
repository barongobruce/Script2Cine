# Script2Cine
AI-assisted cinematic video creation engine

> **Turn your script into cinema.**

Script2Cine is an AI-powered video production system designed to automate the repetitive visual-production stage of cinematic storytelling.

The creator provides a **finished script containing detailed scene prompts** and a **completed narration audio track**.

Script2Cine processes those instructions, generates the required cinematic footage scene by scene, synchronizes the visuals with the narration, assembles everything into a complete video, and exports a polished video ready for the creator's final edit.

---

## 🎬 The Idea

The creative work remains with the creator.

Script2Cine handles the repetitive production work.

```text
CREATOR
   │
   ├── Script
   ├── Scene Prompts
   └── Narration Audio
            │
            ▼
      ┌──────────────┐
      │ SCRIPT2CINE  │
      └──────┬───────┘
             │
             ▼
       Read & Parse Scenes
             │
             ▼
      Generate Visuals
             │
             ▼
       Animate / Process
             │
             ▼
      Synchronize Timeline
             │
             ▼
       Assemble Video
             │
             ▼
        Final Render
             │
             ▼
       🎥 FINAL VIDEO
             │
             ▼
          CAPCUT
             │
             ▼
      Creator's Final Edit
```

---

# 🎯 What Script2Cine Does

Script2Cine focuses specifically on the production stage between **prepared storytelling material** and **finished cinematic footage**.

### The creator provides:

- A complete script
- Detailed prompts for each scene
- Finished narration audio

### Script2Cine handles:

- Script parsing
- Scene detection
- Scene ordering
- Visual prompt processing
- AI visual generation
- Scene animation/generation
- Scene timing
- Narration synchronization
- Video assembly
- Transitions
- Final rendering
- MP4 export

### The creator finishes:

- Background music
- Final creative adjustments
- Final mastering
- Publishing

---

# 📝 Input

A project begins with two primary inputs.

## 1. Script + Scene Prompts

The creator provides a prepared production script containing the narration and detailed visual instructions.

Example:

```text
SCENE 01

Duration: 6 seconds

Narration:
David walked slowly toward the battlefield.

Visual Prompt:
Cinematic biblical-era David walking through an ancient
valley toward a distant battlefield. Ancient Israelite
warriors can be seen in the distance. Dramatic morning
light. Historically inspired clothing. Photorealistic
cinematic composition.

Camera:
Slow tracking shot from behind.

Mood:
Tense, dramatic, epic.
```

Followed by:

```text
SCENE 02

Duration: 6 seconds

Narration:
Across the valley stood Goliath.

Visual Prompt:
A massive Philistine warrior standing across the valley,
towering over the surrounding soldiers...

Camera:
Slow cinematic push-in.

Mood:
Threatening, intimidating.
```

Script2Cine uses the scene instructions as the **visual production blueprint**.

---

## 2. Narration Audio

The creator supplies the finished narration.

Example:

```text
David_and_Goliath_Narration.mp3
```

The narration becomes the primary timeline for the final video.

---

# 🎥 Scene-Based Production

Script2Cine is designed around individual cinematic scenes.

A typical storytelling video may contain dozens of short scenes.

For example:

```text
5-minute video
≈ 300 seconds

6-second scenes
≈ 50 scenes
```

Each scene is independently processed and then assembled into the final timeline.

```text
Scene 01 → Scene 02 → Scene 03 → Scene 04 → ...
   6s         6s         6s         6s
```

This allows individual scenes to be regenerated without rebuilding the entire production.

---

# 🔊 Narration Synchronization

The narration is the master timeline.

For example:

```text
00:00 ─────────────────────────────── 05:00
             NARRATION

00:00–00:06  Scene 01
00:06–00:12  Scene 02
00:12–00:18  Scene 03
00:18–00:24  Scene 04
...
```

The goal is for the visual progression to follow the storytelling progression.

The final video should therefore feel like:

**Narration → Story moment → Visual representation → Next story moment**

rather than a collection of unrelated AI-generated clips.

---

# ⚙️ Production Pipeline

```text
             INPUT
               │
       ┌───────┴────────┐
       │                │
     SCRIPT          NARRATION
   + PROMPTS           AUDIO
       │                │
       └───────┬────────┘
               ▼
        SCRIPT PARSER
               │
               ▼
         SCENE MANAGER
               │
               ▼
       GENERATION QUEUE
               │
        ┌──────┴──────┐
        ▼             ▼
    Scene 01       Scene 02
        │             │
        ▼             ▼
    AI Visual       AI Visual
    Generation      Generation
        │             │
        └──────┬──────┘
               ▼
        VIDEO PROCESSING
               │
               ▼
       TIMELINE ASSEMBLY
               │
               ▼
            FFmpeg
               │
               ▼
        FINAL VIDEO.mp4
```

---

# 🖥️ Application Concept

The initial application will provide a simple production dashboard.

```text
┌─────────────────────────────────────────────┐
│                 SCRIPT2CINE                 │
│                                             │
│  New Project                                │
│                                             │
│  Project Name                               │
│  [ David & Goliath                     ]    │
│                                             │
│  SCRIPT + SCENE PROMPTS                    │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │      DROP SCRIPT HERE                 │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  NARRATION                                  │
│  ┌───────────────────────────────────────┐  │
│  │      DROP AUDIO HERE                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│         [ START PRODUCTION ]                │
│                                             │
└─────────────────────────────────────────────┘
```

After production begins:

```text
┌─────────────────────────────────────────────┐
│              DAVID & GOLIATH                │
│                                             │
│  Scenes: 51                                 │
│  Narration: 05:03                           │
│                                             │
│  Scene 01     ✓ Complete                    │
│  Scene 02     ✓ Complete                    │
│  Scene 03     ✓ Complete                    │
│  Scene 04     ⟳ Generating                  │
│  Scene 05     ○ Waiting                     │
│  Scene 06     ○ Waiting                     │
│                                             │
│  Progress                                    │
│  ███████████████░░░░░  72%                 │
│                                             │
└─────────────────────────────────────────────┘
```

When production is complete:

```text
┌─────────────────────────────────────────────┐
│           PRODUCTION COMPLETE               │
│                                             │
│           David & Goliath                   │
│                                             │
│           Duration: 05:03                   │
│           Scenes: 51                        │
│           Status: Complete                  │
│                                             │
│       [ PREVIEW ]  [ EXPORT MP4 ]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 🧠 Design Philosophy

Script2Cine is **not intended to replace the creator's creative direction**.

The creator decides:

- What story to tell
- What the script says
- What each scene should represent
- How each scene should look
- What narration should sound like
- What music should accompany the final video

Script2Cine handles the repetitive execution required to turn those decisions into visual footage.

> **The creator directs. Script2Cine produces.**

---

# 🏗️ Architecture

The application will be designed as a modular production pipeline.

```text
                    FRONTEND
               React + TypeScript
                       │
                       ▼
                   BACKEND API
                       │
            ┌──────────┴──────────┐
            │                     │
         DATABASE              JOB QUEUE
            │                     │
            │            ┌────────┴────────┐
            │            │                 │
            │       GENERATION        RENDERING
            │        WORKERS            WORKER
            │            │                 │
            │            ▼                 ▼
            │        AI SERVICES        FFmpeg
            │            │                 │
            └────────────┴─────────┬───────┘
                                   │
                                   ▼
                              FILE STORAGE
                                   │
                                   ▼
                              FINAL VIDEO
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Node.js
- TypeScript
- REST API

## Database

- PostgreSQL

## Video Processing

- FFmpeg

## Background Processing

- Job queue / worker architecture

## Storage

- Object storage for:
  - Scripts
  - Narration
  - Generated images
  - Generated video clips
  - Intermediate files
  - Final renders

## AI Services

External AI media-generation providers will be integrated through modular services.

The architecture should remain provider-agnostic so that generation providers can be replaced or added later.

---

# 📂 Project Structure

The initial structure is expected to evolve during development.

```text
script2cine/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── workers/
│
├── database/
│
├── media/
│   ├── input/
│   ├── generated/
│   ├── audio/
│   ├── temporary/
│   └── renders/
│
├── scripts/
│
├── .env.example
├── README.md
└── package.json
```

---

# 🚀 Development Roadmap

## Phase 1 — Project Foundation

- [ ] Initialize application
- [ ] Create React frontend
- [ ] Create backend
- [ ] Create project dashboard
- [ ] Create project
- [ ] Upload script
- [ ] Upload narration
- [ ] Parse scenes
- [ ] Display scene list

## Phase 2 — Scene Production

- [ ] Connect AI generation provider
- [ ] Generate individual scenes
- [ ] Store generated media
- [ ] Display generation status
- [ ] Preview scenes
- [ ] Regenerate failed scenes
- [ ] Replace individual scenes

## Phase 3 — Video Assembly

- [ ] Determine scene timeline
- [ ] Synchronize narration
- [ ] Assemble generated footage
- [ ] Add transitions
- [ ] Process audio
- [ ] FFmpeg rendering
- [ ] Generate final MP4

## Phase 4 — Production Reliability

- [ ] Background workers
- [ ] Generation queues
- [ ] Retry failed jobs
- [ ] Error handling
- [ ] Progress tracking
- [ ] Persistent projects
- [ ] Storage management

## Phase 5 — Advanced Production

- [ ] Character consistency
- [ ] Visual continuity
- [ ] Multiple AI providers
- [ ] Batch production
- [ ] Custom cinematic presets
- [ ] Advanced scene controls
- [ ] Multiple output resolutions
- [ ] Production history

---

# 🔐 Security

API keys and private credentials must never be committed to GitHub.

Environment variables will be used for private configuration.

Example:

```env
DATABASE_URL=

AI_API_KEY=

STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

A `.env.example` file will document the required configuration without exposing real credentials.

---

# 📌 Current Status

**🚧 Early Development**

Script2Cine is currently being designed and developed.

The initial goal is simple:

> **Upload a prepared script with detailed scene prompts and a finished narration, then receive a complete cinematic video.**

---

# 🔮 Future Vision

Script2Cine will eventually become a complete production engine for AI-assisted storytelling.

The long-term workflow:

```text
                 CREATIVE IDEA
                       │
                       ▼
                    SCRIPT
                       │
                       ▼
                SCENE PROMPTS
                       │
                       ▼
                 NARRATION
                       │
                       ▼
                 SCRIPT2CINE
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        AI VISUALS           VIDEO ENGINE
             │                   │
             └─────────┬─────────┘
                       ▼
                 FINAL VIDEO
                       │
                       ▼
                    CAPCUT
                       │
                       ▼
              FINAL CREATIVE EDIT
                       │
                       ▼
                   PUBLISHED
```

Script2Cine's purpose is to remove the repetitive production work while allowing the creator to remain in control of the story and final creative direction.

---

## 📜 License

License to be determined.
