import { SlideUp, FadeIn } from '../ui/motion';
import { Shield, Lock, FileCheck, Search } from 'lucide-react';

const WorkFlow = () => {
  const steps = [
    {
      title: "Upload",
      desc: "Securely drop your PDF or DOCX file. Zero-logging ensures data deletion.",
      icon: <Lock className="w-6 h-6" />,
      color: "bg-blue-500"
    },
    {
      title: "Analyze",
      desc: "Our AI maps your contract against the Indian Contract Act, 1872.",
      icon: <Search className="w-6 h-6" />,
      color: "bg-indigo-500"
    },
    {
      title: "Scan",
      desc: "We flag unfair clauses, non-competes, and statutory deviations.",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-violet-500"
    },
    {
      title: "Report",
      desc: "Get an ELI5 summary and download your precision analysis report.",
      icon: <FileCheck className="w-6 h-6" />,
      color: "bg-zinc-950"
    }
  ];

  return (
    <div className="py-32 bg-zinc-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SlideUp className="text-center mb-24">
          <div className="text-indigo-600 text-xs font-black uppercase tracking-[0.3em] mb-4">The Process</div>
          <h2 className="text-5xl font-display font-black text-zinc-950 tracking-tighter uppercase italic">
            How It <span className="text-indigo-600 not-italic">Works.</span>
          </h2>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[40px] left-0 w-full h-0.5 bg-zinc-200 -z-10" />
          
          {steps.map((step, i) => (
            <SlideUp key={i} delay={i * 0.1} className="relative flex flex-col items-center text-center group">
              <div className={`w-20 h-20 rounded-[2rem] ${step.color} text-white flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500 ring-8 ring-white z-10`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter mb-4">{step.title}</h3>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-[200px]">
                {step.desc}
              </p>
              
              {/* Step number indicator */}
              <div className="mt-8 text-[40px] font-black text-zinc-100 group-hover:text-zinc-200 transition-colors">
                0{i + 1}
              </div>
            </SlideUp>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkFlow;
