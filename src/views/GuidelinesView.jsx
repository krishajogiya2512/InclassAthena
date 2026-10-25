export function GuidelinesView() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-7 animate-fade-in select-none">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security &amp; Examination Guidelines</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review standard examination policies and Athena Focus Mode operational expectations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* Rule 1: Distraction-free Focus Mode */}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">Athena Focus Mode Policy</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Athena is designed to isolate the assessment workstation. During an active session, only <strong>Athena</strong> and <strong>Google Chrome</strong> are authorized to run. Other communication applications, developer IDEs, music players, and background chat tools must remain closed.
          </p>
        </div>

        {/* Rule 2: Fullscreen Display */}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">Continuous Fullscreen Requirement</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Candidates must keep the examination window in full-screen mode throughout the assessment duration. Exiting full-screen mode or switching desktop workspaces registers an audit event in the proctoring log.
          </p>
        </div>

        {/* Rule 3: Graceful Termination and Document Safety */}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">Document Protection &amp; Graceful Application Quitting</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Athena sends standard macOS termination requests rather than force-killing processes. If an eligible application contains unsaved documents, it may prompt you before closing. Closed applications will not automatically reopen once Focus Mode ends.
          </p>
        </div>

        {/* Rule 4: System Exclusions */}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-900">macOS System Services Integrity</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Essential system services (such as Finder, Dock, WindowServer, and NotificationCenter) are excluded from termination to protect macOS system stability and preserve system login credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
