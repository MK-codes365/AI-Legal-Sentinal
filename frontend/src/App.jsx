import { useState, useRef, useEffect } from 'react';
import { BentoGrid, BentoGridItem } from './components/layout/BentoGrid';
import { FadeIn, SlideUp } from './components/ui/motion';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BackToTop from './components/layout/BackToTop';
import AboutPage from './components/pages/AboutPage';
import { FileText, Shield, BarChart3, UploadCloud, Scissors, BookOpen, Download, Trash2, Scale, Zap, ArrowRight, CheckCircle2, AlertTriangle, ChevronLeft, Lock, Play, Pause } from 'lucide-react';
import './index.css';
import { demoData } from './lib/mockData';

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

  const onTogglePlayback = () => {
    if (playerRef.current.paused) {
      playerRef.current.play();
      setIsPlayerPlaying(true);
    } else {
      playerRef.current.pause();
      setIsPlayerPlaying(false);
    }
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
                            <h1 className="text-3xl font-black tracking-tighter text-zinc-950">Vidhi Setu <span className="text-zinc-300 font-light mx-1">/</span> <span className="text-zinc-500 font-bold">Dashboard</span></h1>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Precision Analysis</span>
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
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<Shield className="w-6 h-6 text-zinc-900" />}
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
                                }`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                          flag.risk_level === 'High' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                                      }`}>
                                          {flag.risk_level} Risk
                                      </span>
                                      <span className="px-2 py-1 bg-zinc-900 text-white rounded text-[10px] font-mono font-bold border border-zinc-700">
                                          {flag.law}
                                      </span>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                                          {flag.section}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-zinc-950 text-lg leading-tight tracking-tight">{flag.title}</div>
                                    <p className="line-clamp-4 text-zinc-600 italic leading-relaxed pl-3 border-l-4 border-zinc-200 text-xs bg-zinc-50/50 py-2 rounded-r-lg">
                                        "{flag.text}"
                                    </p>
                                    <div className="mt-2 pt-3 border-t border-zinc-100 bg-white p-3 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Local AI Insight</span>
                                        </div>
                                        <p className="text-zinc-800 text-sm font-medium leading-normal">{flag.explanation || flag.reason}</p>
                                    </div>
                                </div>
                                }
                                className="md:col-span-1"
                                icon={<AlertTriangle className={`w-6 h-6 ${flag.risk_level === 'High' ? 'text-red-500' : 'text-amber-500'}`} />}
                            />
                            ))}
                            
                            {analysisResult.deviations && analysisResult.deviations.length > 0 && (
                              <div className="md:col-span-3 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
                                <div className="flex items-center gap-2 mb-4">
                                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                                  <h3 className="text-xl font-bold text-amber-900">Unfair Terms Detected</h3>
                                </div>
                                <p className="text-sm text-amber-700 mb-4">
                                  {analysisResult.deviation_count} clause{analysisResult.deviation_count > 1 ? 's' : ''} deviate from fair contract standards:
                                </p>
                                <div className="space-y-3">
                                  {analysisResult.deviations?.map((dev, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-amber-900">{dev.category}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                          dev.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                          {dev.severity} Severity
                                        </span>
                                      </div>
                                      <div className="text-sm space-y-1 text-zinc-700">
                                        <p><strong>Your Contract:</strong> {dev.actual}</p>
                                        <p><strong>Fair Standard:</strong> {dev.fair_baseline}</p>
                                        <p className="text-amber-800 mt-2"><strong>💡 Recommendation:</strong> {dev.recommendation}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </BentoGrid>
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
        <div className="flex items-center gap-5 cursor-pointer" onClick={returnToHome}>
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center">
            <img src="/favicon.jpeg" alt="Vidhi Setu Logo" className="w-[90%] h-[90%] object-contain" style={{ imageRendering: 'high-quality' }} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-extrabold tracking-tighter text-zinc-950">Vidhi Setu</h1>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Legal Tech Intelligence</span>
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
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 bg-black text-transparent bg-clip-text">
          Bridging Indian law and fair contracts <br /> with Precision.
          </h2>
        </SlideUp>

        <SlideUp delay={0.3}>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            VidhiSetu bridges complex Indian contract law and freelancers by translating risky clauses into simple, explainable insights—without storing user data.
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

      <div id="action" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <SlideUp className="text-center mb-16">
            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Live Demo</h3>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Dashboard in Action</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
              See how Vidhi Setu transforms complex legal documents into clear, actionable insights in seconds.
            </p>
          </SlideUp>

          <SlideUp delay={0.2}>
            <div className="relative aspect-video max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-zinc-900 group">
              <video 
                ref={playerRef}
                className="w-full h-full object-cover cursor-pointer"
                autoPlay 
                muted 
                loop 
                playsInline
                poster="/assets/vision.png"
                onTimeUpdate={onUpdateProgress}
                onClick={onTogglePlayback}
              >
                <source src="/dashboard.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-col gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={playProgress} 
                    onChange={onManualSeek}
                    className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-white hover:accent-zinc-200 transition-all"
                  />
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={onTogglePlayback}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg hover:scale-105 transition-transform"
                    >
                      {isPlayerPlaying ? <Pause className="w-6 h-6 fill-zinc-900" /> : <Play className="w-6 h-6 fill-zinc-900 ml-1" />}
                    </button>
                    <div className="text-white/60 text-xs font-bold tracking-widest uppercase">
                      Vidhi Setu Dashboard Demo
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors pointer-events-none" />
              
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
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
