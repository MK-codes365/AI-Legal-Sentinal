import { motion } from 'framer-motion';
import { Zap, ExternalLink, Calendar, ArrowUpRight, Newspaper } from 'lucide-react';

const NEWS_UPDATES = [
    {
        tag: "Amendment",
        title: "Digital Personal Data Protection Act (DPDP) 2023",
        date: "Jan 2026",
        summary: "Strict compliance requirements for data fiduciaries in India. All service contracts must now include specific data processing clauses.",
        impact: "High",
        link: "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
    },
    {
        tag: "Supreme Court",
        title: "Clarification on Arbitration Seat vs Venue",
        date: "Dec 2025",
        summary: "New ruling simplifies jurisdiction disputes in commercial contracts. Seat designation now overrides venue for court jurisdiction.",
        impact: "Medium",
        link: "https://main.sci.gov.in/"
    },
    {
        tag: "Policy",
        title: "Gig Worker Social Security Code",
        date: "Feb 2026",
        summary: "New mandates for aggregators to contribute to gig worker welfare funds. Impacts freelancer-client service agreements.",
        impact: "High",
        link: "https://labour.gov.in/"
    }
];

const LegalPulse = () => {
    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Legal Pulse</h2>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Updates • Awareness</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {NEWS_UPDATES.map((news, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -5 }}
                        className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-md text-zinc-500">
                                    {news.tag}
                                </span>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{news.date}</span>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">
                                {news.title}
                            </h3>
                            <p className="text-[11px] text-zinc-500 leading-relaxed mb-4 line-clamp-3">
                                {news.summary}
                            </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${news.impact === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Impact: {news.impact}</span>
                            </div>
                            <a 
                                href={news.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 bg-zinc-50 rounded-lg hover:bg-zinc-900 hover:text-white transition-all"
                            >
                                <ArrowUpRight className="w-3 h-3" />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* News Awareness Marquee/Notice */}
            <div className="mt-4 bg-zinc-900 p-3 rounded-xl overflow-hidden relative">
                <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                         <Newspaper className="w-3 h-3" /> Important Update:
                    </span>
                    <span className="text-[10px] font-medium text-white/80">
                        The Indian Contract Act amendments regarding Electronic Contracts are now in effect. Ensure all digital agreements comply with Section 10A requirements.
                    </span>
                    {/* Repeat for continuous look */}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2 ml-8">
                         <Newspaper className="w-3 h-3" /> Digital India Update:
                    </span>
                    <span className="text-[10px] font-medium text-white/80">
                        Stay aware of the latest DPDP Act rules for data processing in freelance consulting agreements.
                    </span>
                </div>
            </div>
        </section>
    );
};

export default LegalPulse;
