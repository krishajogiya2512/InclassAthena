import { useState } from "react";
import {
  ShieldCheckIcon,
  ClockIcon,
  CameraIcon,
  CheckCircleIcon
} from "../components/Icons";

export function ExamEnvironmentView({
  videoRef,
  isCameraActive,
  timeLeftFormatted,
  focusStatus,
  onReturnToSetup
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({ 1: "b", 2: null, 3: null });
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions = [
    {
      id: 1,
      title: "Question 1: Process Management & Memory Hierarchies",
      prompt: "In modern operating systems, which CPU scheduling algorithm is non-preemptive and selects the process with the smallest execution time?",
      options: [
        { key: "a", text: "Round Robin (RR)" },
        { key: "b", text: "Shortest Job Next (SJN / SPN)" },
        { key: "c", text: "Multi-Level Feedback Queue (MLFQ)" },
        { key: "d", text: "Shortest Remaining Time First (SRTF)" }
      ]
    },
    {
      id: 2,
      title: "Question 2: Security & Isolation Architecture",
      prompt: "What is the primary security guarantee provided by contextIsolation in Electron desktop applications?",
      options: [
        { key: "a", text: "It compiles renderer code into native machine instructions." },
        { key: "b", text: "It isolates preload scripts and Electron internal APIs from the untrusted website DOM context." },
        { key: "c", text: "It automatically grants root-level privileges to background subprocesses." },
        { key: "d", text: "It disables HTTPS certificate verification." }
      ]
    },
    {
      id: 3,
      title: "Question 3: Desktop Environment & Window Management",
      prompt: "Why must proctoring applications request standard termination (AppleEvents) rather than sending SIGKILL to third-party applications?",
      options: [
        { key: "a", text: "To allow applications to safely flush dirty buffers, display unsaved document alerts, and terminate gracefully." },
        { key: "b", text: "Because SIGKILL is exclusively supported on Windows operating systems." },
        { key: "c", text: "To guarantee that closed applications will restart automatically upon reboot." },
        { key: "d", text: "It prevents Electron from utilizing GPU hardware acceleration." }
      ]
    }
  ];

  const currentQ = questions.find((q) => q.id === currentQuestion) || questions[0];

  const handleSelectOption = (optKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optKey
    }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in select-none">
      {/* Top Session Security Strip */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wide flex items-center gap-2">
              <span>LIVE PROCTORED EXAMINATION</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                SECURE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Room 04 • Candidate ATH-2026-904 • Focus Mode: {focusStatus === "active" ? "Enforced" : "Active"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 font-mono text-xs">
            <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Remaining:</span>
            <span className="font-bold text-amber-400">{timeLeftFormatted}</span>
          </div>

          <button
            onClick={onReturnToSetup}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Setup
          </button>
        </div>
      </div>

      {/* Main Examination Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question & Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Assessment Section 1 of 1
              </span>
              <span className="text-xs text-slate-400">Question {currentQuestion} of {questions.length}</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{currentQ.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{currentQ.prompt}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion] === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleSelectOption(option.key)}
                    className={`w-full text-left p-4 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs font-medium"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {option.key}
                    </span>
                    <span className="leading-snug">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={currentQuestion === 1}
                onClick={() => setCurrentQuestion((q) => Math.max(1, q - 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>

              {currentQuestion < questions.length ? (
                <button
                  onClick={() => setCurrentQuestion((q) => Math.min(questions.length, q + 1))}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={() => setIsSubmitted(true)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>

          {isSubmitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-fade-in">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Assessment responses successfully committed and encrypted with candidate signature.</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Proctor Feed & Question Palette */}
        <div className="space-y-6">
          {/* Live Proctoring Webcam Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CameraIcon className="w-3.5 h-3.5 text-blue-600" />
                Live Proctor Feed
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MONITORING
              </span>
            </div>

            <div className="relative w-full aspect-4/3 rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex items-center justify-center">
              <video
                autoPlay
                playsInline
                muted
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="text-center text-slate-500 text-xs p-3">
                  <CameraIcon className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  <span>Proctor camera stream idle</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-2 px-1 text-center">
              Candidate verification model: active
            </p>
          </div>

          {/* Question Palette */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Question Palette</h4>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q) => {
                const isCurrent = currentQuestion === q.id;
                const isAnswered = Boolean(selectedAnswers[q.id]);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(q.id)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : isAnswered
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Current
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
