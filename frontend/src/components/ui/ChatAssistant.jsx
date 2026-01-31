import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles, ChevronDown, Trash2 } from 'lucide-react';

const ChatAssistant = ({ analysisResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            id: 'welcome', 
            role: 'bot', 
            content: "Hello! I'm Vidhi, your legal assistant. I've analyzed your contract. You can ask me anything about it!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api';

        try {
            const response = await fetch(`${API_BASE}/ask-contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content })
            });

            if (!response.ok) throw new Error("Failed to get answer");

            const data = await response.json();
            
            const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                content: data.answer,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'bot',
                content: "I'm sorry, I'm having trouble connecting to my local brain right now. Please ensure the backend is running.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            { 
                id: 'welcome', 
                role: 'bot', 
                content: "Chat cleared. How else can I help you with this contract?",
                timestamp: new Date()
            }
        ]);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-zinc-200 mb-4 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-zinc-900 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-zinc-900" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">Vidhi AI Assistant</h3>
                                <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Live & Secure</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearChat} title="Clear conversation" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-50/50 scroll-smooth">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] relative ${
                                        msg.role === 'user' ? 'items-end' : 'items-start'
                                    } flex flex-col gap-1`}>
                                        <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-zinc-900 text-white rounded-br-none' 
                                                : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-40 px-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest">
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
                                            <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-duration:0.8s]" />
                                            <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vidhi is thinking...</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-zinc-100 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about the contract..."
                                className="flex-1 bg-zinc-100 border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-zinc-900 transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-zinc-900 text-white p-2.5 rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                    isOpen ? 'bg-zinc-900 text-white' : 'bg-amber-400 text-zinc-900'
                }`}
            >
                {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 border-2 border-white rounded-full flex items-center justify-center overflow-hidden">
                         <div className="w-full h-full bg-green-500 animate-pulse" />
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default ChatAssistant;
