import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BentoGrid, BentoGridItem } from './components/layout/BentoGrid';
import { FadeIn, SlideUp } from './components/ui/motion';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BackToTop from './components/layout/BackToTop';
import AboutPage from './components/pages/AboutPage';
import { FileText, Shield, BarChart3, UploadCloud, Scissors, BookOpen, Download, Trash2,  Scale, MessageSquare, Clock, 
  MapPin, CheckCircle2, XCircle, ChevronRight, 
  ShieldCheck, AlertTriangle, HelpCircle, 
  Menu, X, Send, Zap, ArrowRight, ChevronLeft, Lock, Play, Pause, Briefcase, Rocket, Home, ChevronDown, List, Sparkles, Wand2 
} from 'lucide-react';
import './index.css';
import { demoData } from './lib/mockData';
import ChatAssistant from './components/ui/ChatAssistant';
import LegalFAQ from './components/ui/LegalFAQ';
import LegalPulse from './components/ui/LegalPulse';

function AppContent() {
  const [contractFile, setContractFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const filePickerRef = useRef(null);
  const [activeView, setActiveView] = useState('landing');
  const playerRef = useRef(null);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(true);
  const [playProgress, setPlayProgress] = useState(0);
  const [explanations, setExplanations] = useState({});
  const [highlights, setHighlights] = useState({});
  const [isExplaining, setIsExplaining] = useState({});
  const [redlinedIndices, setRedlinedIndices] = useState({}); // Tracking redlined deviations
  const [redlinedFlags, setRedlinedFlags] = useState({}); // Tracking redlined risk flags
  const [isDownloading, setIsDownloading] = useState(false);
  const [mappingQuery, setMappingQuery] = useState('');
  const [mappingInput, setMappingInput] = useState("");
  const [mappingResult, setMappingResult] = useState(null);
  const [isMapping, setIsMapping] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'lab'

  const onTogglePlayback = () => {
    if (playerRef.current.paused) {
      playerRef.current.play();
      setIsPlayerPlaying(true);
    } else {
      playerRef.current.pause();
      setIsPlayerPlaying(false);
    }
  };

  const applyRedlineDev = (idx) => {
    setRedlinedIndices(prev => ({ ...prev, [idx]: true }));
  };

  const applyRedlineFlag = (idx) => {
    setRedlinedFlags(prev => ({ ...prev, [idx]: true }));
  };

  const onUpdateProgress = () => {
    const totalDuration = playerRef.current.duration;
    const elapsed = playerRef.current.currentTime;
    setPlayProgress((elapsed / totalDuration) * 100);
  };

  const onManualSeek = (e) => {
    const designatedTime = (e.target.value / 100) * playerRef.current.duration;
    playerRef.current.currentTime = designatedTime;
    setPlayProgress(e.target.value);
  };

  const onFileSelected = (e) => {
    const pickedFile = e.target.files[0];
    setContractFile(pickedFile);
  };

  const onOpenPicker = () => {
    filePickerRef.current.click();
  };

  const onStartAnalysis = async () => {
    if (!contractFile) return;
    setIsAnalyzing(true);
    
    const payload = new FormData();
    payload.append('file', contractFile);

    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';

    try {
      const serverResponse = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: payload,
      });
      const resultData = await serverResponse.json();
      setAnalysisResult(resultData);
      setCurrentRiskScore(resultData.risk_score || 0);
      setActiveView('dashboard');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Upload failed:', err);
      alert("Failed to analyze the contract. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = async () => {
    if (!analysisResult) return;
    setIsDownloading(true);
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal ? `http://${window.location.hostname}:8000` : '/api';
    try {
        const response = await fetch(`${API_BASE_URL}/download-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(analysisResult)
        });

        if (!response.ok) throw new Error("Failed to download report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Vidhi_Setu_Report_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        console.error("Download error:", err);
        alert("Could not generate report. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'lab' && mappingQuery.length > 20) {
      const timer = setTimeout(() => {
        testMapping();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [mappingQuery, activeTab]);

  // Dynamic Risk Score Recalculation
  useEffect(() => {
    if (!analysisResult) return;

    let baseScore = 0;
    
    // Calculate based on Risk Flags (highlights) that are NOT redlined
    analysisResult.risk_flags?.forEach((flag, idx) => {
        // A flag is considered "fixed" if it is redlined directly OR if its corresponding deviation is fixed
        const isFlagRedlined = redlinedFlags[idx];
        const isDevRedlined = analysisResult.deviations?.some((dev, dIdx) => 
            dev.clause_reference === flag.clause_id && redlinedIndices[dIdx]
        );

        if (!isFlagRedlined && !isDevRedlined) {
            if (flag.risk_level === 'High') baseScore += 25;
            else if (flag.risk_level === 'Medium') baseScore += 10;
            else baseScore += 3;
        }
    });

    // We only use risk_flags for the score as per backend logic
    setCurrentRiskScore(Math.min(100, baseScore));
  }, [analysisResult, redlinedFlags, redlinedIndices]);

  const testMapping = async () => {
    if (!mappingQuery.trim() || mappingQuery.length < 10) return;
    setIsMapping(true);
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? `http://${window.location.hostname}:8000` : '/api';
    
    try {
      const response = await fetch(`${API_BASE}/map-statute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause: mappingQuery })
      });
      const data = await response.json();
      setMappingResult(data);
    } catch (err) {
      console.error("Mapping failed:", err);
    } finally {
      setIsMapping(false);
    }
  };

  const onLoadSample = async () => {
    setIsAnalyzing(true);
    setActiveView('dashboard');
    await new Promise(r => setTimeout(r, 1500));
    
    setContractFile({ name: 'sample_contract.md' });
    setAnalysisResult(demoData);
    setCurrentRiskScore(demoData.risk_score);
    setIsAnalyzing(false);
    window.scrollTo(0, 0);
  };
  
  const returnToHome = () => {
    setActiveView('landing');
    window.scrollTo(0, 0);
  };

  const onResetSession = () => {
      setContractFile(null);
      setAnalysisResult(null);
      setActiveView('landing');
      setCurrentRiskScore(0);
      window.scrollTo(0, 0);
  };
  
  const onPurgeUserData = async () => {
      if (!confirm("Delete all session data? This will permanently remove your contract analysis from memory.")) {
          return;
      }
      
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';
      
      try {
          await fetch(`${API_BASE}/session`, {
              method: 'DELETE'
          });
          onResetSession();
      } catch (err) {
          console.error("Purge failed:", err);
      }
  };

  const explainClause = async (text, id, reason) => {
    if (explanations[id]) return; // Already explained
    
    setIsExplaining(prev => ({ ...prev, [id]: true }));
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';
    
    try {
      const response = await fetch(`${API_BASE}/explain-clause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, reason })
      });
      const data = await response.json();
      setExplanations(prev => ({ ...prev, [id]: data.explanation }));
      setHighlights(prev => ({ ...prev, [id]: data.highlights_html }));
    } catch (err) {
      console.error("Explanation failed:", err);
      setExplanations(prev => ({ ...prev, [id]: "Could not generate explanation right now." }));
    } finally {
      setIsExplaining(prev => ({ ...prev, [id]: false }));
    }
  };

  const appCapabilities = [
    { title: "Contract upload", desc: "(PDF / Word)", icon: <UploadCloud className="w-6 h-6 text-blue-500" /> },
    { title: "Clause extraction", desc: "(Non-compete, IP, Termination, etc.)", icon: <Scissors className="w-6 h-6 text-amber-600" /> },
    { title: "Indian Act & Section mapping", desc: "Maps clauses to specific Indian statutes.", icon: <BookOpen className="w-6 h-6 text-teal-500" /> },
    { title: "Statutory risk scoring", desc: "(High / Medium / Low)", icon: <Scale className="w-6 h-6 text-slate-500" /> },
    { title: "Overall Risk Score", desc: "(0-100)", icon: <Zap className="w-6 h-6 text-orange-500" /> },
    { title: "Template deviation check", desc: "Compares against fair contract baseline.", icon: <CheckCircle2 className="w-6 h-6 text-green-600" /> },
    { title: "PII tokenization", desc: "Replaces sensitive data with privacy tokens.", icon: <Shield className="w-6 h-6 text-indigo-500" /> },
    { title: "Jurisdiction lock", desc: "Blocks foreign law references completely.", icon: <Shield className="w-6 h-6 text-red-500" /> },
    { title: "Citation-first display", desc: "Prominent Act & Section for each risk.", icon: <FileText className="w-6 h-6 text-purple-500" /> },
    { title: "ELI5 explanations", desc: "Simple summaries of complex legal terms.", icon: <FileText className="w-6 h-6 text-cyan-500" /> },
    { title: "Downloadable results", desc: "Export analysis for offline review.", icon: <Download className="w-6 h-6 text-green-500" /> },
    { title: "User-controlled deletion", desc: "Permanently remove your data anytime.", icon: <Trash2 className="w-6 h-6 text-red-500" /> }
  ];

  if (activeView === 'dashboard') {
      return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
            <header className="bg-white border-b-2 border-zinc-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-40 flex justify-between items-center">
                    <div className="flex items-center gap-5 cursor-pointer" onClick={returnToHome}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-50 shadow-lg bg-white flex items-center justify-center">
                            <img src="/favicon.jpeg" alt="Vidhi Setu Logo" className="w-[90%] h-[90%] object-contain" style={{ imageRendering: 'high-quality' }} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-tighter text-zinc-950 flex items-center gap-3">
                                Vidhi Setu <span className="text-zinc-300 font-light">/</span> <span className="text-zinc-500 font-bold">Dashboard</span>
                                <span className="text-[10px] font-bold text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full uppercase tracking-widest bg-zinc-50 translate-y-0.5">Law Mapping Strength</span>
                            </h1>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg border border-zinc-800 shadow-xl group hover:scale-105 transition-transform">
                            <Scale className="w-4 h-4 text-amber-400" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">Legal Grounding</span>
                                <span className="text-xs font-black tracking-tight">The Indian Contract Act, 1872</span>
                            </div>
                        </div>
                        <button onClick={() => { setActiveView('about'); window.scrollTo(0, 0); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                            About
                        </button>
                        {analysisResult?.pii_tokenized && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                🔒 PII Protected ({analysisResult.token_count} items)
                            </span>
                        )}
                        {analysisResult && <span className="text-sm text-zinc-500">File: <span className="font-semibold text-zinc-900">{contractFile?.name}</span></span>}
                        <div className="h-4 w-px bg-zinc-200 mx-2" />
                        {analysisResult && (
                          <button onClick={onPurgeUserData} className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded transition">
                              <Trash2 className="w-4 h-4" /> Delete Data
                          </button>
                        )}
                        {analysisResult && (
                            <button 
                                onClick={downloadReport} 
                                disabled={isDownloading}
                                className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} /> 
                                {isDownloading ? 'Generating...' : 'Download PDF'}
                            </button>
                        )}
                        <button onClick={onResetSession} className="px-5 py-2 bg-zinc-900 text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95">
                            New Analysis
                        </button>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {analysisResult ? (
                   <SlideUp>
                    <div className="mb-8 font-serif">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">
                             <BookOpen className="w-4 h-4" /> Statutory Analysis
                        </div>
                        <h2 className="text-4xl font-black mb-2 tracking-tight">Analysis Results</h2>
                        <p className="text-zinc-500 italic">Comprehensive assessment grounded in <strong className="text-zinc-900 font-bold">The Indian Contract Act, 1872</strong>.</p>
                    </div>

                    {/* JUDGES LAB TAB MODAL */}
                    <div className="flex gap-4 mb-8 border-b border-zinc-200">
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'text-zinc-950 border-b-4 border-zinc-950' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            Executive Analysis
                        </button>
                        <button 
                            onClick={() => setActiveTab('lab')}
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'lab' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-zinc-400 hover:text-blue-400'}`}
                        >
                            👨‍⚖️ Statutory Mapping Lab
                        </button>
                        <button 
                            onClick={() => setActiveTab('resources')}
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'text-red-500 border-b-4 border-red-500' : 'text-zinc-400 hover:text-red-400'}`}
                        >
                            🌍 Legal Resources
                        </button>
                    </div>

                    {activeTab === 'resources' ? (
                        <SlideUp>
                            <LegalPulse />
                            <LegalFAQ />
                        </SlideUp>
                    ) : activeTab === 'lab' ? (
                        <SlideUp className="max-w-4xl mx-auto py-8">
                            <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-2xl p-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-zinc-900 leading-none">Statutory Mapping Lab</h3>
                                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Live Real-time Analysis</span>
                                            </div>
                                        </div>
                                        <p className="text-zinc-500 font-medium mt-1">Verify the technical mapping pipeline for judges.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <textarea
                                            value={mappingQuery}
                                            onChange={(e) => setMappingQuery(e.target.value)}
                                            placeholder="Paste any legal clause here to find its exact mapping in the Indian Contract Act..."
                                            className="w-full h-40 p-6 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all font-medium text-zinc-800 placeholder:text-zinc-300 resize-none"
                                        />
                                        <button 
                                            onClick={testMapping}
                                            disabled={isMapping}
                                            className="absolute bottom-4 right-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isMapping ? 'Processing Pipeline...' : 'Run Mapping Pipeline'}
                                        </button>
                                    </div>

                                    {mappingResult && (
                                        <FadeIn className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl border border-zinc-800 overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Scale className="w-40 h-40" />
                                            </div>
                                            
                                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Automated Mapping Result</div>
                                                    <div className="text-4xl font-black mb-1">{mappingResult.section}</div>
                                                    <div className="text-xl text-zinc-400 font-medium mb-6">{mappingResult.title}</div>
                                                    
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Act</span>
                                                            <span className="text-sm font-black">{mappingResult.act}</span>
                                                        </div>
                                                        <div className="h-8 w-px bg-zinc-800" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase whitespace-nowrap">Law Mapping Strength:</span>
                                                            <span className="text-sm font-black text-green-400">{(mappingResult.confidence * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pipeline Reasoning</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                                                        "{mappingResult.reasoning}"
                                                    </p>
                                                </div>
                                            </div>
                                        </FadeIn>
                                    )}
                                </div>
                            </div>
                        </SlideUp>
                    ) : (
                        <>
                        {/* Deviation Check / Unfair Terms - MOVED UP FOR VISIBILITY */}
                        <div className={`mb-8 p-6 rounded-2xl border-l-4 transition-all ${
                            analysisResult.deviations?.length > 0 
                            ? 'bg-amber-50 border-amber-500 shadow-amber-100' 
                            : 'bg-green-50 border-green-500 shadow-green-100'
                        } shadow-lg`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={`w-8 h-8 ${analysisResult.deviations?.length > 0 ? 'text-amber-600' : 'text-green-600'}`} />
                                    <div>
                                        <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Fairness & Deviation Check</h3>
                                        <p className="text-xs text-zinc-500 font-medium italic">Comparison against industry-standard "Fair Baselines"</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                    analysisResult.deviations?.length > 0 ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                    {analysisResult.deviations?.length || 0} DEVIATIONS FOUND
                                </span>
                            </div>

                            {analysisResult.deviations?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysisResult.deviations.map((dev, idx) => (
                                        <div key={idx} className={`bg-white/80 backdrop-blur-sm p-4 rounded-xl border transition-all duration-500 ${
                                            redlinedIndices[idx] ? 'border-green-500 shadow-green-100 bg-green-50/20' : 'border-amber-100 shadow-sm'
                                        } hover:shadow-md`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`font-black text-xs uppercase tracking-widest px-2 py-1 rounded ${
                                                    redlinedIndices[idx] ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-900'
                                                }`}>
                                                    {redlinedIndices[idx] ? 'Fixed Clause' : dev.category}
                                                </span>
                                                {!redlinedIndices[idx] && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                        dev.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {dev.severity} SEVERITY
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-3 text-xs leading-relaxed">
                                                <div className="flex gap-2 relative">
                                                    <span className="font-bold text-zinc-400 shrink-0">
                                                        {redlinedIndices[idx] ? 'FIXED:' : 'FOUND:'}
                                                    </span>
                                                    <div className="relative overflow-hidden w-full">
                                                        <AnimatePresence mode="wait">
                                                            <motion.span 
                                                                key={redlinedIndices[idx] ? 'redlined' : 'original'}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className={redlinedIndices[idx] ? 'text-green-700 font-bold' : 'text-zinc-600 italic'}
                                                            >
                                                                "{redlinedIndices[idx] ? dev.redline_suggestion : dev.actual}"
                                                            </motion.span>
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                {!redlinedIndices[idx] && (
                                                    <>
                                                        <div className="flex gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                                            <span className="font-bold text-blue-400 shrink-0">FAIR:</span>
                                                            <span className="text-blue-800">{dev.fair_baseline}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                                                            <button 
                                                                onClick={() => applyRedlineDev(idx)}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-zinc-800 transition-colors group"
                                                            >
                                                                <Wand2 className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                                                                Apply Smart Redline
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="text-green-800 font-bold text-sm uppercase tracking-tight">Your contract follows all standard fairness baselines! No predatory deviations detected.</span>
                                </div>
                            )}
                        </div>

                        <BentoGrid className="max-w-full">
                            <BentoGridItem 
                            title="Risk Score"
                            description="Overall contract risk assessment."
                            header={
                                <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-white items-center justify-center relative overflow-hidden group">
                                    <span className={`text-8xl font-black ${currentRiskScore > 70 ? 'text-red-500' : currentRiskScore > 40 ? 'text-amber-500' : 'text-green-500'} relative z-10`}>
                                        {currentRiskScore}
                                    </span>
                                </div>
                            }
                            className="md:col-span-1 md:row-span-2"
                            icon={<BarChart3 className="w-6 h-6 text-zinc-900" />}
                            />
                            
                            <BentoGridItem 
                            title="Contract Summary"
                            description="Key details extracted."
                            header={
                                <div className="p-6 bg-white rounded-xl h-full flex flex-col justify-center space-y-4">
                                <div className="flex justify-between border-b border-zinc-100 pb-2">
                                    <span className="text-zinc-500 text-sm">Type</span>
                                    <span className="font-semibold text-zinc-900">{analysisResult.summary?.contract_type || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-100 pb-2">
                                    <span className="text-zinc-500 text-sm">Parties</span>
                                    <span className="font-semibold text-zinc-900 truncate max-w-[200px]" title={analysisResult.summary?.parties?.join(', ')}>{analysisResult.summary?.parties?.join(', ') || 'N/A'}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Duration</span>
                                    <span className="font-semibold text-zinc-900">{analysisResult.summary?.duration || 'Indefinite'}</span>
                                </div>
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Termination Notice</div>
                                        <div className="font-medium text-zinc-900">{analysisResult.summary?.termination_notice || 'N/A'}</div>
                                    </div>
                                    {analysisResult.summary?.vesting_schedule && (
                                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Vesting Schedule</div>
                                            <div className="font-medium text-zinc-900">{analysisResult.summary?.vesting_schedule}</div>
                                        </div>
                                    )}
                                    {analysisResult.summary?.lock_in_period && (
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Lock-in Period</div>
                                            <div className="font-medium text-zinc-900">{analysisResult.summary?.lock_in_period}</div>
                                        </div>
                                    )}
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<Shield className="w-6 h-6 text-zinc-900" />}
                            />
                            
                            <BentoGridItem 
                            title="Structure & Completeness"
                            description="Standard clause verification."
                            header={
                                <div className="p-6 bg-white rounded-xl h-full flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                     <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Completeness Score</span>
                                     <span className={`text-2xl font-black ${
                                        (analysisResult.structure_analysis?.completeness_score || 0) > 80 ? 'text-green-600' :
                                        (analysisResult.structure_analysis?.completeness_score || 0) > 50 ? 'text-amber-600' : 'text-red-500'
                                     }`}>
                                        {analysisResult.structure_analysis?.completeness_score || 0}%
                                     </span>
                                  </div>
                                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full transition-all duration-1000 ${
                                            (analysisResult.structure_analysis?.completeness_score || 0) > 80 ? 'bg-green-500' :
                                            (analysisResult.structure_analysis?.completeness_score || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`} 
                                        style={{ width: `${analysisResult.structure_analysis?.completeness_score || 0}%` }}
                                     />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs mt-2 overflow-y-auto max-h-[140px] pr-2 scrollbar-thin overflow-x-visible">
                                     {analysisResult.structure_analysis?.present_clauses?.map((clause, i) => (
                                         <div key={i} className="flex items-center gap-1.5 text-zinc-700 bg-green-50 px-2 py-1 rounded border border-green-100 group/item relative cursor-help z-10">
                                            <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                                            <span className="truncate">{clause.title}</span>
                                            <div className="absolute bottom-[calc(100%+5px)] left-0 hidden group-hover/item:block w-56 p-3 bg-zinc-900 text-white text-[10px] rounded-xl shadow-2xl z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                                                <div className="flex items-center gap-1 mb-1 text-green-400 font-bold">
                                                    <Sparkles className="w-3 h-3" /> Simply Explained:
                                                </div>
                                                <div className="leading-relaxed opacity-90">{clause.eli5}</div>
                                                <div className="absolute top-full left-4 border-8 border-transparent border-t-zinc-900" />
                                            </div>
                                         </div>
                                     ))}
                                     {analysisResult.structure_analysis?.missing_clauses?.map((clause, i) => (
                                         <div key={i} className="flex items-center gap-1.5 text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 opacity-70 group/item relative cursor-help z-10">
                                            <div className="w-3 h-3 rounded-full border border-zinc-300 shrink-0" />
                                            <span className="truncate line-through decoration-zinc-300">{clause.title}</span>
                                            <div className="absolute bottom-[calc(100%+5px)] left-0 hidden group-hover/item:block w-56 p-3 bg-zinc-900 text-white text-[10px] rounded-xl shadow-2xl z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                                                <div className="flex items-center gap-1 mb-1 text-amber-400 font-bold">
                                                    <Sparkles className="w-3 h-3" /> Simply Explained:
                                                </div>
                                                <div className="leading-relaxed opacity-90">{clause.eli5}</div>
                                                <div className="absolute top-full left-4 border-8 border-transparent border-t-zinc-900" />
                                            </div>
                                         </div>
                                     ))}
                                  </div>
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<List className="w-6 h-6 text-zinc-900" />}
                            />

                            {analysisResult.risk_flags?.map((flag, idx) => (
                            <BentoGridItem
                                key={idx}
                                title={flag.law || "Legal Risk"}
                                description={flag.section || ""}
                                header={
                                <div className={`p-5 rounded-xl h-full text-sm flex flex-col gap-3 ${
                                    flag.risk_level === 'High' 
                                    ? 'border-l-4 border-red-500 bg-red-50/50' 
                                    : 'border-l-4 border-amber-500 bg-amber-50/50'
                                } shadow-sm relative overflow-hidden`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                          flag.risk_level === 'High' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                                      }`}>
                                          {flag.risk_level} Risk
                                      </span>
                                      <span className="px-2 py-1 bg-zinc-900 text-white rounded text-[10px] font-mono font-bold border border-zinc-700">
                                          {flag.law}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-zinc-950 text-lg leading-tight tracking-tight">{flag.title}</div>
                                    
                                    <div className="relative overflow-hidden mb-1">
                                        <AnimatePresence mode="wait">
                                            <motion.p 
                                                key={redlinedFlags[idx] ? 'redlined' : 'original'}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className={`line-clamp-6 leading-relaxed pl-3 border-l-4 text-xs py-2 rounded-r-lg ${
                                                    redlinedFlags[idx] 
                                                    ? 'text-green-700 font-bold border-green-500 bg-green-50/20' 
                                                    : 'text-zinc-600 italic border-zinc-200 bg-zinc-50/50'
                                                }`}
                                            >
                                                "{redlinedFlags[idx] ? flag.redline_suggestion : flag.text}"
                                            </motion.p>
                                        </AnimatePresence>
                                    </div>

                                    {redlinedFlags[idx] ? (
                                        <div className="py-2 px-3 bg-green-100/50 border border-green-200 rounded-xl flex items-center gap-2 text-[10px] font-bold text-green-700">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Fairness Redline Applied
                                        </div>
                                    ) : (
                                        <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest leading-none">Local AI Insight</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {!explanations[idx] && !isExplaining[idx] && (
                                                    <button 
                                                        onClick={() => explainClause(flag.text, idx, flag.reason || flag.explanation)}
                                                        className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                                                    >
                                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                                        ✨ Explain Simply
                                                    </button>
                                                )}
                                                
                                                {flag.redline_suggestion && (
                                                    <button 
                                                        onClick={() => applyRedlineFlag(idx)}
                                                        className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all group active:scale-95"
                                                    >
                                                        <Wand2 className="w-3 h-3 text-white group-hover:rotate-12 transition-transform" />
                                                        🛠️ Suggest Fair Redline
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isExplaining[idx] ? (
                                        <div className="flex items-center gap-2 animate-pulse py-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            <span className="text-zinc-400 text-[10px] font-bold italic">AI is explaining...</span>
                                        </div>
                                    ) : explanations[idx] ? (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed font-medium animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-1.5 mb-1 text-blue-900 font-bold uppercase tracking-tight text-[9px]">
                                                <Sparkles className="w-3 h-3" /> Simply Explained
                                            </div>
                                            "{explanations[idx]}"
                                        </div>
                                    ) : (
                                        <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-2 opacity-60 italic">
                                            {flag.explanation || flag.reason}
                                        </p>
                                    )}
                                </div>
                                }
                                className="md:col-span-1"
                                icon={<AlertTriangle className={`w-6 h-6 ${flag.risk_level === 'High' ? 'text-red-500' : 'text-amber-500'}`} />}
                            />
                            ))}
                            
                        </BentoGrid>
                        </>
                    )}
                   </SlideUp>
                ) : (
                  <SlideUp className="max-w-4xl mx-auto py-12">
                    <div className="bg-white rounded-3xl border-2 border-dashed border-zinc-200 p-16 text-center hover:border-zinc-400 transition-all group relative overflow-hidden">
                      <div className="absolute inset-0 bg-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {!contractFile ? (
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-10 h-10 text-zinc-900" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">Analyze Your Contract</h3>
                          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                            Upload a PDF or Word document to begin your Indian-law grounded analysis. 
                            Names and emails will be tokenized automatically.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={onOpenPicker}
                                className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold shadow-lg hover:shadow-2xl transition-all active:scale-95"
                            >
                                Select Document
                            </button>
                            <button 
                                onClick={onLoadSample}
                                className="px-8 py-4 bg-white border-2 border-zinc-900 text-zinc-900 rounded-full font-bold hover:bg-zinc-50 transition-all flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" /> Test with Sample
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                           <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-green-600" />
                          </div>
                           <h3 className="text-2xl font-bold mb-1">{contractFile.name}</h3>
                           <p className="text-zinc-500 mb-8">Ready for precision analysis</p>
                           
                           <div className="flex gap-4">
                             <button 
                                onClick={onStartAnalysis}
                                disabled={isAnalyzing}
                                className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold shadow-lg hover:bg-zinc-800 transition-all flex items-center gap-2 ring-4 ring-zinc-900/10"
                             >
                               {isAnalyzing ? (
                                 <>
                                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                   Analyzing...
                                 </>
                               ) : (
                                 <span className="flex items-center gap-2">
                                   TEST ANALYSIS <ArrowRight className="w-4 h-4" />
                                 </span>
                               )}
                             </button>
                             <button 
                                onClick={() => setContractFile(null)}
                                className="px-8 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-full font-bold hover:bg-zinc-50 transition-all"
                             >
                               Cancel
                             </button>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[
                         { icon: <Shield className="w-5 h-5" />, text: "Zero-logging Architecture" },
                         { icon: <Scale className="w-5 h-5" />, text: "Indian Law Grounded" },
                         { icon: <Lock className="w-5 h-5" />, text: "Auto-PII Tokenization" }
                       ].map((tip, i) => (
                         <div key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-400">
                           <div className="p-2 bg-zinc-100 rounded-lg">{tip.icon}</div>
                           {tip.text}
                         </div>
                       ))}
                    </div>
                  </SlideUp>
                )}
                <input ref={filePickerRef} type="file" className="hidden" onChange={onFileSelected} />
            </main>
            {analysisResult && <ChatAssistant analysisResult={analysisResult} />}
        </div>
      );
  }

  if (activeView === 'about') {
    return (
      <AboutPage 
        onBack={returnToHome} 
        hasAnalysis={!!analysisResult}
        onDashboard={() => { setActiveView('dashboard'); window.scrollTo(0, 0); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white overflow-x-hidden flex flex-col">
      <FadeIn className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center z-50 relative w-full">
        <div className="flex items-center gap-6 cursor-pointer" onClick={returnToHome}>
          {/* Changed to rounded-3xl to show full logo including text at bottom */}
          <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center shrink-0">
            <img src="/favicon.jpeg" alt="Vidhi Setu Logo" className="w-full h-full object-contain p-2" style={{ imageRendering: 'high-quality' }} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-6xl font-extrabold tracking-tighter text-zinc-950 leading-none mb-1">Vidhi Setu</h1>
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">Legal Tech Intelligence</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-500">
          <a href="#features" className="hover:text-zinc-900 transition-colors relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-zinc-900 transition-all group-hover:w-full" />
          </a>
          <a href="#vision" className="hover:text-zinc-900 transition-colors relative group">
            Vision
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-zinc-900 transition-all group-hover:w-full" />
          </a>
          <button onClick={() => { setActiveView('about'); window.scrollTo(0, 0); }} className="hover:text-zinc-900 transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-zinc-900 transition-all group-hover:w-full" />
          </button>
          
          {analysisResult && (
            <button 
              onClick={() => { setActiveView('dashboard'); window.scrollTo(0, 0); }} 
              className="px-4 py-2 bg-zinc-900 text-white rounded-full text-xs font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <BarChart3 className="w-3.5 h-3.5" /> View Dashboard
            </button>
          )}
        </nav>
      </FadeIn>

      <div className="max-w-5xl mx-auto text-center pt-24 pb-32 px-6 relative flex-grow">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-zinc-200/50 to-transparent blur-3xl -z-10 rounded-full opacity-50 pointer-events-none" />
        
        <SlideUp delay={0.2}>
          <h2 className="text-6xl md:text-5xl lg:text-5xl font-bold tracking-tighter mb-6 bg-black text-transparent bg-clip-text">
          An Indian-Law-Grounded, Privacy-First Ai<br/>Contract Analyzer
          </h2>
        </SlideUp>

        <SlideUp delay={0.3}>
          <p className="text-zinc-600 text-lg md:text-l max-w-2xl mx-auto mb-12 leading-relaxed">
          Empowering freelancers and small business to understand contracts before signing
          VidhiSetu analyzes agreements under Indian law, flags unfair clauses, explains risk clearly,
          and protects user data by design.
          </p>
        </SlideUp>
        
        <SlideUp delay={0.4} className="flex flex-col items-center gap-4">
           <button 
              onClick={() => { setActiveView('dashboard'); window.scrollTo(0, 0); }}
              className="group relative bg-zinc-900 text-white px-10 py-5 rounded-full font-semibold text-lg hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex items-center gap-3"
           >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
        </SlideUp>
      </div>

      <div id="features" className="bg-white py-24 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
            <SlideUp className="text-center mb-16">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Why Our Solution Stands On Top</h3>
                <p className="text-zinc-500 max-w-xl mx-auto">Comprehensive tools designed for freelancers and startups to navigate complex Indian legal contracts.</p>
            </SlideUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {appCapabilities.map((feat, idx) => (
                     <SlideUp key={idx} delay={0.1 + (idx * 0.05)} className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 hover:shadow-lg transition-all group cursor-default">
                         <div className="mb-4 p-3 bg-white rounded-xl w-fit border border-zinc-100 shadow-sm group-hover:scale-110 transition-transform">
                             {feat.icon}
                         </div>
                         <h4 className="text-lg font-bold mb-2 text-zinc-900">{feat.title}</h4>
                         <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
                     </SlideUp>
                 ))}
            </div>
        </div>
      </div>

      <div id="use-cases" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <SlideUp className="text-center mb-16">
            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Who is this for?</h3>
            <h2 className="text-4xl font-bold mb-4">Tailored for Modern Contracts</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Whether you're freelancing, launching a startup, or renting a home, Vidhi Setu creates a level playing field.</p>
          </SlideUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SlideUp delay={0.1} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Freelancers</h3>
              <ul className="space-y-3 text-zinc-600 text-sm">
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Check Service Agreements</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Spot unfair Non-Competes</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Verify IP Ownership clauses</li>
              </ul>
            </SlideUp>

            <SlideUp delay={0.2} className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Startups & Founders</h3>
              <ul className="space-y-3 text-zinc-600 text-sm">
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Review Vendor Contracts</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Analyze Employment Letters</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Ensure Statutory Compliance</li>
              </ul>
            </SlideUp>
          </div>
        </div>
      </div>

      <div id="vision" className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <SlideUp delay={0.2} className="relative">
                  <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-zinc-100">
                      <img src="/assets/vision.png" alt="Vidhi Setu Vision" className="w-full h-auto object-cover" />
                  </div>
                  <div className="absolute -top-10 -left-10 w-full h-full bg-zinc-100 rounded-3xl -z-10" />
              </SlideUp>
              
              <SlideUp delay={0.4}>
                  <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Our Vision</h3>
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                    Clarity over contracts, <br/> grounded in Indian law.
                  </h2>
                  <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
                      <p>
                        We believe that every agreement should be a bridge, not a barrier. By demystifying complex legal jargon and anchoring every insight in the Indian Contract Act, we bring absolute clarity to the signatures that shape your professional future.
                      </p>
                      <p>
                        Our vision is to democratize legal intelligence for the Indian creative community, providing a trustworthy companion that ensures fairness and transparency in every contract you sign.
                      </p>
                  </div>
              </SlideUp>
          </div>
      </div>



      <div id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SlideUp className="text-center mb-20">
            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">The Process</h3>
            <h2 className="text-4xl font-bold">How Vidhi Setu Works</h2>
          </SlideUp>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="hidden md:block absolute top-1/4 left-[33%] right-[33%] h-0.5 border-t-2 border-dashed border-zinc-200 -z-0" />
            
            <SlideUp delay={0.1} className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-zinc-900 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-xl ring-8 ring-zinc-50">1</div>
              <h4 className="text-xl font-bold mb-3">Upload Securely</h4>
              <p className="text-zinc-500 max-w-[250px]">
                Drop your PDF or Doc. Names and emails are instantly tokenized to protect your privacy.
              </p>
              <ArrowRight className="md:hidden w-6 h-6 text-zinc-300 my-6 rotate-90" />
            </SlideUp>

            <SlideUp delay={0.2} className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-zinc-900 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-xl ring-8 ring-zinc-50">2</div>
              <h4 className="text-xl font-bold mb-3">Legal Mapping</h4>
              <p className="text-zinc-500 max-w-[250px]">
                Our AI maps clauses to the **Indian Contract Act** and highlights unfair deviations.
              </p>
              <ArrowRight className="md:hidden w-6 h-6 text-zinc-300 my-6 rotate-90" />
            </SlideUp>

            <SlideUp delay={0.3} className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-zinc-900 text-white flex items-center justify-center text-2xl font-black mb-6 shadow-xl ring-8 ring-zinc-50">3</div>
              <h4 className="text-xl font-bold mb-3">Sign with Clarity</h4>
              <p className="text-zinc-500 max-w-[250px]">
                Review your 0-100 risk score and ELI5 explanations before taking the next step.
              </p>
            </SlideUp>
          </div>
        </div>
      </div>

      

      <div id="faq" className="py-24 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto px-6">
          <SlideUp className="text-center mb-16">
            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Common Questions</h3>
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </SlideUp>

          <div className="grid gap-6">
            <SlideUp delay={0.1} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-400" />
                Is this legal advice?
              </h4>
              <p className="text-zinc-600 ml-7">
                No. Vidhi Setu is an AI-powered analysis tool. While it provides detailed insights based on the Indian Contract Act, it is not a substitute for a qualified lawyer. Always consult legal counsel for critical decisions.
              </p>
            </SlideUp>

            <SlideUp delay={0.2} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-400" />
                Is my document safe?
              </h4>
              <p className="text-zinc-600 ml-7">
                Absolutely. We use a privacy-first architecture. Your documents are analyzed in memory and personal identifiers (PII) are tokenized before processing. We do not store your contracts on our servers.
              </p>
            </SlideUp>

            <SlideUp delay={0.3} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <HelpCircle className="w-5 h-5 text-zinc-400" />
                 What file formats are supported?
              </h4>
              <p className="text-zinc-600 ml-7"> 
                Currently, we support PDF (`.pdf`) and Word (`.docx`) documents. Text files and Markdown are also supported.
              </p>
            </SlideUp>
          </div>
        </div>
      </div>
      <div id="cta" className="py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-100 z-0" />
        <div className="absolute w-[800px] h-[800px] bg-amber-50 rounded-full blur-3xl opacity-30 -top-40 -left-40 z-0" />
        <div className="absolute w-[600px] h-[600px] bg-red-50 rounded-full blur-3xl opacity-30 -bottom-40 -right-40 z-0" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <SlideUp>
             <h2 className="text-5xl md:text-7xl font-black text-zinc-900 mb-8 tracking-tighter leading-tight">
               Sign Contracts,<br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600">Without the Fear.</span>
             </h2>
             <p className="text-zinc-600 max-w-2xl mx-auto text-xl mb-12 font-medium leading-relaxed">
               Thousands of Indian freelancers have protected their income with Vidhi Setu. 
               Join them today for a free, instant legal review.
             </p>
             <button 
                onClick={() => { setActiveView('dashboard'); window.scrollTo(0, 0); }}
                className="group relative bg-zinc-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl hover:shadow-zinc-900/20 overflow-hidden flex items-center justify-center gap-3 mx-auto"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-black opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  Analyze My Contract Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
             </button>
             <p className="mt-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">No Credit Card Required • Local & Private</p>
           </SlideUp>
        </div>
      </div>

      {analysisResult && <ChatAssistant analysisResult={analysisResult} />}
      <Footer />
      <BackToTop />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
