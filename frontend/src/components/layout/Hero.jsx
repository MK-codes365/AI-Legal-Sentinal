import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { SlideUp, FadeIn } from '../ui/motion';

const Hero = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute -top-[10%] -right-[10%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <SlideUp className="text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/5 border border-zinc-950/10 text-zinc-950 text-xs font-bold tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v2.0 Beta • Precision Legal AI
          </div>
          
          <h1 className="text-6xl md:text-7xl font-display font-black tracking-tight text-zinc-950 leading-[0.9] uppercase italic">
            Clarity in <br />
            <span className="text-blue-600 not-italic">Every Clause.</span>
          </h1>
          
          <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-xl">
            The first AI-powered contract analyzer built specifically for the <span className="text-zinc-950 font-bold">Indian ecosystem</span>. Protected by zero-logging architecture and privacy-first design.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onGetStarted}
              className="group relative bg-zinc-950 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl active:scale-95 flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10 transition-transform group-hover:-translate-x-1">Get Started Now</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <button className="px-10 py-5 bg-white border border-zinc-200 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all active:scale-95">
              Watch Demo
            </button>
          </div>
          
          <div className="flex items-center gap-6 pt-8 border-t border-zinc-100">
             <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
             <div className="text-sm font-bold text-zinc-400">
               <span className="text-zinc-950">500+</span> Freelancers trust Vidhi Setu
             </div>
          </div>
        </SlideUp>
        
        <FadeIn delay={0.4} className="relative">
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-8 border-white group">
            <img 
              src="/assets/hero-mockup.png" 
              alt="Vidhi Setu Analysis Interface" 
              className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000" 
            />
            {/* Overlay glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Floating tags */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-6 p-4 glass-premium rounded-2xl shadow-2xl z-20 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">99.8% Accuracy</span>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -left-10 p-6 glass rounded-3xl shadow-2xl z-20 border border-white/40"
          >
            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Compliance Check</div>
              <div className="text-xs font-bold text-zinc-950">Indian Contract Act, 1872</div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                <div className="w-[85%] h-full bg-blue-500" />
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-zinc-300" />
      </div>
    </div>
  );
};

export default Hero;
