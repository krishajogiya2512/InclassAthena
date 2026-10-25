import {
  ShieldIcon,
  ShieldCheckIcon,
  AppWindowIcon,
  EyeIcon,
  BookOpenIcon,
  LockIcon,
  UserIcon
} from "./Icons";

export function Sidebar({ currentView, setCurrentView, focusStatus = "inactive", isCameraActive = false, isFullscreen = false }) {
  const navItems = [
    {
      id: "system-check",
      label: "System Verification",
      description: "Camera & screen readiness",
      icon: ShieldIcon,
      badge: isCameraActive && isFullscreen ? "Ready" : "Pending",
      badgeColor: isCameraActive && isFullscreen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    {
      id: "focus-mode",
      label: "Athena Focus Mode",
      description: "Distraction-free environment",
      icon: AppWindowIcon,
      badge: focusStatus === "active" ? "Active" : focusStatus === "active_with_exceptions" ? "Partial" : "Inactive",
      badgeColor: focusStatus === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : focusStatus === "active_with_exceptions" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-700/40 text-slate-400 border-slate-600/30"
    },
    {
      id: "examination",
      label: "Examination Room",
      description: "Launch assessment session",
      icon: EyeIcon,
      badge: "Session #491",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      id: "guidelines",
      label: "Rules & Security",
      description: "Proctoring compliance",
      icon: BookOpenIcon
    }
  ];

  return (
    <aside className="w-72 bg-[#0B132B] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-slate-300">
      {/* Top Branding Section */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">ATHENA</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PROCTOR
                </span>
              </div>
              <p className="text-xs text-slate-400">Secure Examination Desktop</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-6">
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white font-medium shadow-sm shadow-blue-600/30"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                    <div className="truncate">
                      <div className="text-sm leading-tight truncate">{item.label}</div>
                      <div className={`text-[11px] truncate mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Candidate & Security Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080E21]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            <UserIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">Candidate Session</div>
            <div className="text-[11px] text-slate-400 truncate">ID: ATH-2026-904</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="System connected & secured" />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <LockIcon className="w-3 h-3 text-slate-400" /> TLS 1.3 Active
          </span>
          <span>v1.2.0</span>
        </div>
      </div>
    </aside>
  );
}
