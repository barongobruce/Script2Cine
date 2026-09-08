import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Clapperboard,
  FilePlus2,
  Film,
  FolderOpen,
  Grid2X2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  Moon,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import NewProject from "./NewProject";
import ProjectDetail from "./ProjectDetail";
import WorkspaceView from "./WorkspaceView";

type ProjectStatus = "Generating visuals" | "Complete" | "Rendering";

type Project = {
  id: string;
  title: string;
  sceneCount: number;
  duration: string;
  status: ProjectStatus;
  progress: number;
  updated: string;
  image: string;
  steps?: { name: string; status: "complete" | "active" | "waiting"; detail: string }[];
};

const assets = {
  jonah: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
  jericho: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  babylon: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
};

const fallbackProjects: Project[] = [
  { id: "demo-jonah", title: "Jonah — Chapter 1", sceneCount: 31, duration: "03:06", status: "Generating visuals", progress: 58, updated: "Edited 12 min ago", image: assets.jonah },
  { id: "demo-jericho", title: "The Fall of Jericho", sceneCount: 48, duration: "04:52", status: "Complete", progress: 100, updated: "Edited yesterday", image: assets.jericho },
  { id: "demo-babylon", title: "The Last Days of Babylon", sceneCount: 62, duration: "06:11", status: "Rendering", progress: 81, updated: "Edited 2 days ago", image: assets.babylon },
];

const fallbackPipeline = [
  ["Script", "Complete", "done"],
  ["Scene analysis", "Complete", "done"],
  ["Visual generation", "18 / 31 scenes", "active"],
  ["Timeline", "Waiting", "waiting"],
  ["Render", "Waiting", "waiting"],
] as const;

function relativeTime(dateString: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(dateString)) / 1000));
  if (seconds < 60) return "Updated just now";
  if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `Updated ${Math.floor(seconds / 3600)} hr ago`;
  return `Updated ${Math.floor(seconds / 86400)} days ago`;
}

function Logo() {
  return (
    <div className="dashboard-logo" aria-label="Script2Cine">
      <span className="dashboard-logo__mark"><i /><i /></span>
      <span>Script2Cine</span>
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [view, setView] = useState<"dashboard" | "new-project" | "project-detail" | "workspace">("dashboard");
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (window.localStorage.getItem("script2cine-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("script2cine-theme", theme);
  }, [theme]);

  async function refreshProjects() {
    try {
      const response = await fetch("http://localhost:4000/api/projects");
      if (!response.ok) return;
      const data = await response.json();
      const liveProjects: Project[] = (data.projects || []).map((project: { id: string; name: string; status: string; stage: string; progress: number; updatedAt: string; steps: Project["steps"]; scenes?: unknown[]; audioDurationSeconds?: number | null }, index: number) => ({
        id: project.id,
        title: project.name,
        sceneCount: project.scenes?.length || 0,
        duration: project.audioDurationSeconds ? `${Math.floor(project.audioDurationSeconds / 60).toString().padStart(2, "0")}:${Math.floor(project.audioDurationSeconds % 60).toString().padStart(2, "0")}` : "—",
        status: project.status === "complete" ? "Complete" : project.stage === "render" ? "Rendering" : "Generating visuals",
        progress: project.progress,
        updated: relativeTime(project.updatedAt),
        image: Object.values(assets)[index % Object.values(assets).length],
        steps: project.steps,
      }));
      if (liveProjects.length) {
        setProjects(liveProjects);
        setSelectedProjectId((current) => current && liveProjects.some((project) => project.id === current) ? current : liveProjects[0].id);
      }
    } catch {
      // The dashboard keeps its demo data until the backend is available.
    }
  }

  useEffect(() => {
    void refreshProjects();
    const interval = window.setInterval(() => void refreshProjects(), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const notify = (message: string) => {
    toast.message(message, { description: "This dashboard action is ready for backend wiring." });
    setSidebarOpen(false);
  };

  const openNewProject = () => {
    setView("new-project");
    setActiveNav("New project");
    setSidebarOpen(false);
  };

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView("project-detail");
    setActiveNav("Project detail");
    setSidebarOpen(false);
  };

  const openWorkspace = (section: "Projects" | "Media" | "Templates" | "Settings") => {
    setActiveNav(section);
    setView("workspace");
    setSidebarOpen(false);
  };

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || projects[0];
  const pipeline = selectedProject?.steps?.map((step, index) => [step.name, step.detail, step.status === "complete" ? "done" : step.status] as const) || fallbackPipeline;

  const navItems = [
    ["Dashboard", LayoutDashboard],
    ["Projects", FolderOpen],
    ["Media", Film],
    ["Templates", Grid2X2],
    ["Settings", Settings2],
  ] as const;

  return (
    <div className="dashboard-app">
      <aside className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} type="button" aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-switcher" onClick={() => notify("Workspace switcher")} role="button" tabIndex={0}>
          <span className="workspace-avatar">SC</span>
          <span><strong>Script2Cine Studio</strong><small>Personal workspace</small></span>
          <ChevronDown size={14} />
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map(([label, Icon]) => (
            <button className={activeNav === label ? "dashboard-nav__item dashboard-nav__item--active" : "dashboard-nav__item"} key={label} onClick={() => label === "Dashboard" ? (setView("dashboard"), setActiveNav("Dashboard"), setSidebarOpen(false)) : openWorkspace(label)} type="button">
              <Icon size={17} /><span>{label}</span>{label === "Projects" && <b>3</b>}
            </button>
          ))}
          <p className="nav-label nav-label--second">Create</p>
          <button className="dashboard-nav__item dashboard-nav__item--create" onClick={openNewProject} type="button"><Plus size={17} /><span>New project</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><Clapperboard size={17} /><div><strong>Production guide</strong><small>Learn the workflow</small></div><ChevronDown size={14} /></div>
          <button className="sidebar-profile" onClick={() => notify("Profile settings")} type="button"><span className="profile-avatar">BS</span><span><strong>Bruce Smith</strong><small>Creator account</small></span><MoreHorizontal size={16} /></button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" type="button" />}

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="mobile-sidebar-trigger" onClick={() => setSidebarOpen(true)} type="button" aria-label="Open navigation"><Menu size={21} /></button>
          <div className="dashboard-breadcrumb"><span>Workspace</span><ChevronDown size={13} /><strong>{activeNav}</strong></div>
          <div className="dashboard-header__actions">
            <label className="dashboard-search"><Search size={16} /><input placeholder="Search projects" aria-label="Search projects" /><kbd>⌘ K</kbd></label>
            <button className="icon-button theme-toggle" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} type="button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
            <button className="icon-button" onClick={() => notify("Notifications")} type="button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="header-avatar" onClick={() => notify("Profile settings")} type="button" aria-label="Open profile">BS</button>
          </div>
        </header>

        <main className={`dashboard-content ${view !== "dashboard" ? "dashboard-content--new-project" : ""}`}>
          {view === "workspace" && activeNav !== "Dashboard" && activeNav !== "New project" && activeNav !== "Project detail" ? (
            <WorkspaceView section={activeNav as "Projects" | "Media" | "Templates" | "Settings"} projects={projects} onOpenProject={openProject} onNewProject={openNewProject} />
          ) : view === "new-project" ? (
            <NewProject onCreated={() => void refreshProjects()} onBack={() => { setView("dashboard"); setActiveNav("Dashboard"); }} />
          ) : view === "project-detail" && selectedProjectId ? (
            <ProjectDetail projectId={selectedProjectId} onUpdated={() => void refreshProjects()} onBack={() => { setView("dashboard"); setActiveNav("Dashboard"); }} />
          ) : (
          <>
          <section className="dashboard-welcome">
            <div><p className="dashboard-eyebrow">MONDAY / 09 SEPTEMBER 2026</p><h1>Good evening, Bruce.</h1><p>Continue building your next cinematic project.</p></div>
            <button className="dashboard-primary-button" onClick={openNewProject} type="button"><Plus size={17} /> New project</button>
          </section>

          <section className="dashboard-stats" aria-label="Workspace summary">
            <div className="stat-card"><div className="stat-card__icon stat-card__icon--amber"><Clapperboard size={17} /></div><div><small>Active productions</small><strong>03</strong></div><span className="stat-card__trend">+1 this month</span></div>
            <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue"><Play size={17} /></div><div><small>Scenes in generation</small><strong>18 <em>/ 141</em></strong></div><span className="stat-card__trend stat-card__trend--muted">Across 3 projects</span></div>
            <div className="stat-card"><div className="stat-card__icon stat-card__icon--green"><Film size={17} /></div><div><small>Completed renders</small><strong>07</strong></div><span className="stat-card__trend">+2 this month</span></div>
          </section>

          <section className="quick-actions-section">
            <div className="section-title-row"><div><p className="dashboard-eyebrow">QUICK ACTIONS</p><h2>Move the production forward.</h2></div><span className="section-count">3 actions</span></div>
            <div className="quick-actions">
              <button className="quick-action quick-action--primary" onClick={openNewProject} type="button"><span className="quick-action__icon"><Plus size={20} /></span><span><strong>New project</strong><small>Start a cinematic production</small></span><ChevronDown className="quick-action__arrow" size={16} /></button>
              <button className="quick-action" onClick={openNewProject} type="button"><span className="quick-action__icon"><Upload size={19} /></span><span><strong>Upload script</strong><small>Import scenes and direction</small></span><ChevronDown className="quick-action__arrow" size={16} /></button>
              <button className="quick-action" onClick={openNewProject} type="button"><span className="quick-action__icon"><FilePlus2 size={19} /></span><span><strong>Upload narration</strong><small>Add the master timeline</small></span><ChevronDown className="quick-action__arrow" size={16} /></button>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="recent-projects panel-card">
              <div className="panel-card__header"><div><p className="dashboard-eyebrow">YOUR WORKSPACE</p><h2>Recent projects</h2></div><button className="panel-link" onClick={() => notify("All projects")} type="button">View all <ChevronDown size={14} /></button></div>
              <div className="project-list">
                {projects.map((project) => <article className={`project-row ${selectedProject?.id === project.id ? "project-row--selected" : ""}`} key={project.id} onClick={() => setSelectedProjectId(project.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedProjectId(project.id); }} role="button" tabIndex={0}>
                  <div className="project-thumbnail"><img src={project.image} alt="" /><span className={`project-status project-status--${project.status.split(" ")[0].toLowerCase()}`} /></div>
                  <div className="project-row__body"><div className="project-row__title"><strong>{project.title}</strong><button onClick={() => notify(`${project.title} menu`)} type="button" aria-label={`More options for ${project.title}`}><MoreHorizontal size={17} /></button></div><div className="project-meta"><span>{project.sceneCount} scenes</span><i /> <span>{project.duration}</span><i /> <span>{project.updated}</span></div><div className="project-progress"><span><i style={{ width: `${project.progress}%` }} /></span><b>{project.progress}%</b></div></div>
                  <div className="project-row__actions"><div className={`project-badge project-badge--${project.status.split(" ")[0].toLowerCase()}`}>{project.status}</div>{project.status !== "Complete" && <button className="project-resume-button" type="button" onClick={(event) => { event.stopPropagation(); openProject(project.id); }}>Resume</button>}</div>
                </article>)}
              </div>
            </div>

            <div className="pipeline-panel panel-card">
              <div className="panel-card__header"><div><p className="dashboard-eyebrow">{selectedProject?.title || "SELECTED PROJECT"}</p><h2>Production pipeline</h2></div><button className="panel-icon-button" onClick={() => notify("Pipeline menu")} type="button" aria-label="Pipeline menu"><MoreHorizontal size={17} /></button></div>
              <div className="pipeline-list">{pipeline.map(([stage, status, tone], index) => <div className="pipeline-row" key={stage}><span className={`pipeline-row__marker pipeline-row__marker--${tone}`}>{tone === "done" ? "✓" : index + 1}</span><span><strong>{stage}</strong><small>{status}</small></span>{tone === "active" && <i className="pipeline-row__progress"><b /></i>}</div>)}</div>
              <div className="pipeline-footer"><span>OVERALL PROGRESS</span><strong>{selectedProject?.progress || 0}%</strong><div><i style={{ width: `${selectedProject?.progress || 0}%` }} /></div></div>
            </div>
          </section>

          <section className="activity-bar"><div><span className="activity-dot" /><span><strong>{selectedProject?.status === "Complete" ? "Production is complete" : "Production is in progress"}</strong> on <b>{selectedProject?.title || "your project"}</b></span></div><button onClick={() => selectedProject && openProject(selectedProject.id)} type="button">Resume production <ChevronDown size={14} /></button></section>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
