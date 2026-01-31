import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles, ChevronDown, Trash2 } from 'lucide-react';

const ChatAssistant = ({ analysisResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [botMode, setBotMode] = useState('Professional'); // Professional, ELI5, Negotiator
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('vidhi_chat_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch (e) { return null; }
        }
        return [
            { 
                id: 'welcome', 
                role: 'bot', 
                content: "Hello! I'm Vidhi, your legal assistant. I've analyzed your contract. You can ask me anything about it!",
                timestamp: new Date()
            }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);

    const suggestedQuestions = [
        { label: "Summarize Risks", query: "Can you provide a quick summary of the top 3 risks in this contract?" },
        { label: "Check Compliance", query: "Is this contract compliant with the Indian Contract Act?" },
        { label: "Help Negotiate", query: "Give me 3 points I should negotiate to make this contract fairer for me." },
        { label: "ELI5 Clauses", query: "Pick the most complex clause and explain it like I am 5." }
    ];

    useEffect(() => {
        localStorage.setItem('vidhi_chat_history', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e, forcedQuery = null) => {
        if (e) e.preventDefault();
        const queryText = forcedQuery || input.trim();
        if (!queryText || isLoading) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: queryText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';

        try {
            const response = await fetch(`${API_BASE}/ask-contract-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: queryText,
                    mode: botMode,
                    context_summary: analysisResult?.holistic_narrative || ""
                })
            });

            if (!response.ok) throw new Error("Failed to get stream");

            // Create an empty bot message to fill with stream data
            const botMsgId = Date.now() + 1;
            setMessages(prev => [...prev, {
                id: botMsgId,
                role: 'bot',
                content: '',
                timestamp: new Date()
            }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                accumulatedContent += chunk;
                
                // Update the specifically created bot message
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId ? { ...msg, content: accumulatedContent } : msg
                ));
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'bot',
                content: "I'm sorry, I'm having trouble connecting to my local brain. Please ensure the backend is running.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        localStorage.removeItem('vidhi_chat_history');
        setMessages([
            { 
                id: 'welcome', 
                role: 'bot', 
                content: "Chat cleared. How else can I help you with this contract?",
                timestamp: new Date()
            }
        ]);
    };

    const toggleMic = () => {
        setIsListening(!isListening);
        if (!isListening) {
            // Simulated voice UI trigger
            setTimeout(() => setIsListening(false), 3000);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[420px] h-[600px] bg-white rounded-3xl shadow-2xl border border-zinc-200 mb-4 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-zinc-900 p-5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/20">
                                    <Bot className="w-6 h-6 text-zinc-900" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black uppercase tracking-tight">Vidhi AI</h3>
                                        <select 
                                            value={botMode} 
                                            onChange={(e) => setBotMode(e.target.value)}
                                            className="bg-zinc-800 text-[9px] font-bold border-none rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-amber-400 text-zinc-300"
                                        >
                                            <option>Professional</option>
                                            <option>ELI5</option>
                                            <option>Negotiator</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Local & Encrypted</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearChat} title="Clear conversation" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-zinc-50/50 scroll-smooth">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] relative ${
                                        msg.role === 'user' ? 'items-end' : 'items-start'
                                    } flex flex-col gap-1.5`}>
                                        <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-zinc-900 text-white rounded-br-none' 
                                                : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-40 px-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {msg.role === 'user' ? 'You' : 'Vidhi'}
                                            </span>
                                            <span className="text-[8px]">•</span>
                                            <span className="text-[9px] font-medium">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vidhi is thinking...</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer Section: Suggestions + Input */}
                        <div className="bg-white border-t border-zinc-100 p-4">
                            {/* Suggested Questions */}
                            {!isLoading && messages.length < 5 && (
                                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                                    {suggestedQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(null, q.query)}
                                            className="whitespace-nowrap px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all active:scale-95"
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input Form */}
                            <form onSubmit={handleSend} className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about your rights..."
                                        className="w-full bg-zinc-100 border-none rounded-2xl px-5 py-3 text-xs focus:ring-2 focus:ring-zinc-900 transition-all outline-none pr-10"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={toggleMic}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-zinc-900 text-white p-3.5 rounded-2xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl shadow-zinc-200"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${
                    isOpen ? 'bg-zinc-900 text-white' : 'bg-amber-400 text-zinc-900'
                }`}
            >
                {isOpen ? <ChevronDown className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 border-2 border-white rounded-full flex items-center justify-center overflow-hidden">
                         <div className="w-full h-full bg-green-500 animate-pulse" />
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default ChatAssistant;
