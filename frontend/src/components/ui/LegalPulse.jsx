import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, ArrowUpRight, Newspaper, AlertCircle, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
// Fallback images are now served from the public folder
const courtImg = '/legal_news/court.png';
const paperImg = '/legal_news/paper.png';
const techImg = '/legal_news/tech.png';

const LegalPulse = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const nextSlide = useCallback(() => {
        if (newsItems.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % newsItems.length);
        }
    }, [newsItems.length]);

    const prevSlide = () => {
        if (newsItems.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length);
        }
    };

    useEffect(() => {
        fetchNews();
        
        const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:8000/ws/news' : `ws://${window.location.host}/ws/news`;
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => setIsLive(true);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'new_article') {
                setNewsItems(prev => [message.data, ...prev].slice(0, 10));
                setCurrentIndex(0); // Show newest immediately
            }
        };
        socket.onclose = () => setIsLive(false);

        return () => socket.close();
    }, []);

    // Auto-play timer
    useEffect(() => {
        if (isPaused || isLoading || newsItems.length === 0) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide, isPaused, isLoading, newsItems.length]);

    const fetchNews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';
            const response = await fetch(`${API_BASE}/legal-news`);
            if (!response.ok) throw new Error("Failed to fetch news");
            const data = await response.json();
            setNewsItems(data);
        } catch (err) {
            setError("Could not load latest news.");
        } finally {
            setIsLoading(false);
        }
    };

    const currentNews = newsItems[currentIndex];

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-xl animate-pulse shadow-lg shadow-red-500/20">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Legal Pulse</h2>
                            {isLive && (
                                <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                    <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter">Live Push</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Interactive Slideshow</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        {newsItems.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-zinc-900 w-4' : 'bg-zinc-200'}`}
                            />
                        ))}
                    </div>
                    <button 
                        onClick={fetchNews}
                        className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        Sync
                    </button>
                </div>
            </div>

            <div 
                className="relative group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="bg-white rounded-[32px] border border-zinc-100 shadow-xl overflow-hidden min-h-[220px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8 flex items-center justify-center h-full"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 border-4 border-zinc-100 border-t-red-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scanning Legal Networks...</span>
                                </div>
                            </motion.div>
                        ) : currentNews ? (
                            <motion.div
                                key={currentNews.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 flex flex-col md:flex-row gap-8 h-full"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-1 rounded-lg">
                                            {currentNews.tag}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {currentNews.date}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-lg">
                                            <div className={`w-1.5 h-1.5 rounded-full ${currentNews.impact === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <span className="text-[9px] font-black text-zinc-500 uppercase">Impact: {currentNews.impact}</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight">
                                        {currentNews.title}
                                    </h3>
                                    
                                    <p className="text-sm text-zinc-500 leading-relaxed mb-6 italic line-clamp-2 md:line-clamp-none">
                                        "{currentNews.summary}"
                                    </p>

                                    <div className="flex items-center gap-4">
                                        <a 
                                            href={currentNews.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                                        >
                                            Read Full Article <ArrowUpRight className="w-4 h-4" />
                                        </a>
                                        <button className="p-2.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="hidden md:flex w-1/3 items-center justify-center bg-zinc-50 rounded-2xl relative overflow-hidden group/img border border-zinc-100/50">
                                    {currentNews.image ? (
                                        <img 
                                            src={currentNews.image.startsWith('local:') 
                                                ? currentNews.image === 'local:court' ? courtImg 
                                                : currentNews.image === 'local:paper' ? paperImg 
                                                : techImg
                                                : currentNews.image} 
                                            alt={currentNews.title}
                                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Newspaper className="w-16 h-16 text-zinc-100 group-hover/img:scale-110 transition-transform duration-500" />
                                            <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">No Media Available</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* Nav Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6">
                    <button 
                        onClick={prevSlide}
                        className="p-3 bg-white border border-zinc-100 rounded-full shadow-lg hover:bg-zinc-900 hover:text-white transition-all text-zinc-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6">
                    <button 
                        onClick={nextSlide}
                        className="p-3 bg-white border border-zinc-100 rounded-full shadow-lg hover:bg-zinc-900 hover:text-white transition-all text-zinc-500"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Live Ticker Marquee */}
            <div className="mt-8 bg-zinc-900 p-4 rounded-2xl overflow-hidden relative shadow-2xl">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
                    {[1, 2].map(i => (
                        <div key={i} className="flex items-center gap-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2 bg-amber-400/10 px-3 py-1 rounded-lg">
                                <Zap className="w-3 h-3" /> Live Headline
                            </span>
                            {newsItems.map((item, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-1 bg-zinc-700 rounded-full" /> {item.title}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LegalPulse;
