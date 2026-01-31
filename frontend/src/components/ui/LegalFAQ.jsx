import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Scale, Shield, FileText, Zap } from 'lucide-react';

const FAQ_DATA = [
    {
        category: "Contract Basics",
        items: [
            {
                q: "What makes a contract legally binding in India?",
                a: "Under Section 10 of the Indian Contract Act, 1872, an agreement is binding if it is made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object.",
                icon: <Scale className="w-4 h-4" />
            },
            {
                q: "Is an e-signature valid in India?",
                a: "Yes, under the Information Technology Act, 2000, electronic signatures are legally recognized and have the same status as physical signatures, provided they meet specific security criteria.",
                icon: <FileText className="w-4 h-4" />
            }
        ]
    },
    {
        category: "Rights & Risks",
        items: [
            {
                q: "Can a company prevent me from joining a competitor?",
                a: "In India, Section 27 generally makes 'post-employment' non-compete clauses void. You have the fundamental right to practice any profession, trade, or business.",
                icon: <Shield className="w-4 h-4" />
            },
            {
                q: "What is an 'Indemnity' clause?",
                a: "It's a promise to compensate the other party for any loss or damage. Be careful—unilateral indemnity can make you liable for things outside your control.",
                icon: <HelpCircle className="w-4 h-4" />
            }
        ]
    }
];

const LegalFAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [liveFaqs, setLiveFaqs] = useState([]);

    useEffect(() => {
        // Establish WebSocket for live FAQ updates
        const WS_URL = window.location.hostname === 'localhost' ? 'ws://localhost:8000/ws/news' : `ws://${window.location.host}/ws/news`;
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';
        
        const socket = new WebSocket(WS_URL);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'new_faq') {
                setLiveFaqs(prev => [message.data, ...prev].slice(0, 10));
            }
        };

        // Fetch initial live FAQs
        fetch(`${API_BASE}/live-faqs`)
            .then(res => res.json())
            .then(data => setLiveFaqs(data))
            .catch(err => console.error("Failed to fetch live FAQs:", err));

        return () => socket.close();
    }, []);

    const combinedData = [
        ...FAQ_DATA,
        ...(liveFaqs.length > 0 ? [{
            category: "Community Q&A (Live)",
            items: liveFaqs.map(f => ({
                q: f.q,
                a: f.a,
                icon: <Zap className="w-4 h-4 text-amber-400" />,
                isLive: true,
                time: f.timestamp
            }))
        }] : [])
    ];

    return (
        <section className="mt-16 bg-white rounded-3xl border-2 border-zinc-100 overflow-hidden shadow-sm">
            <div className="bg-zinc-900 p-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-400 rounded-lg">
                        <HelpCircle className="w-6 h-6 text-zinc-900" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Legal knowledge Base</h2>
                </div>
                <p className="text-zinc-400 text-sm font-medium">Quick answers to common legal questions under Indian Law.</p>
            </div>

            <div className="p-8">
                {combinedData.map((cat, catIdx) => (
                    <div key={catIdx} className="mb-10 last:mb-0">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                            <span className="w-8 h-px bg-zinc-200" />
                            {cat.category}
                        </h3>
                        <div className="space-y-4">
                            {cat.items.map((item, idx) => {
                                const isId = `${catIdx}-${idx}`;
                                const isOpen = openIndex === isId;
                                
                                return (
                                    <div key={idx} className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-300'}`}>
                                        <button 
                                            onClick={() => setOpenIndex(isOpen ? null : isId)}
                                            className="w-full p-5 flex items-center justify-between text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-900 text-sm">{item.q}</span>
                                                    {item.isLive && (
                                                        <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-1">
                                                            Live Community Query • {item.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-zinc-900' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 ml-12 text-zinc-600 text-xs leading-relaxed border-t border-zinc-100/50 pt-4">
                                                        {item.a}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default LegalFAQ;
