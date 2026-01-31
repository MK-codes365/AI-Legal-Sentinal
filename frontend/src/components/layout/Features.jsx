import { SlideUp } from '../ui/motion';

const Features = ({ capabilities }) => {
  return (
    <div id="features" className="bg-white py-32 border-y border-zinc-100 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SlideUp className="text-center mb-24">
          <div className="text-blue-600 text-xs font-black uppercase tracking-[0.3em] mb-4">Core Capabilities</div>
          <h2 className="text-5xl font-display font-black text-zinc-950 tracking-tighter mb-6 uppercase italic">
            Engineered for <br />
            <span className="text-zinc-400 not-italic">Legal Precision.</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            Our specialized legal engine provides comprehensive tools for navigating complex Indian contracts with absolute confidence.
          </p>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((feat, idx) => (
            <SlideUp key={idx} delay={idx * 0.05} className="group p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 hover:border-blue-500/20 hover:bg-white hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.15)] transition-all duration-500">
              <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-premium group-hover:scale-110 group-hover:bg-zinc-950 transition-all duration-500">
                <div className="group-hover:invert transition-all">
                  {feat.icon}
                </div>
              </div>
              <h4 className="text-lg font-black mb-3 text-zinc-950 uppercase tracking-tight">{feat.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                {feat.desc}
              </p>
            </SlideUp>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
