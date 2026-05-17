import { useNavigate } from 'react-router-dom';
import { Pencil, Sparkles, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0F172A] border-b border-[#1E293B] z-10">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">Boardify</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm border border-white/30 rounded-lg hover:bg-white/5 transition"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 rounded-lg transition"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-[56px] font-bold leading-tight">
          Collaborate, draw, and think with{' '}
          <span className="text-indigo-500">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-[#94A3B8] mt-6 max-w-xl mx-auto">
          The real-time whiteboard with built-in AI. Draw together, generate diagrams from text,
          and get instant insights.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <button
            onClick={() => navigate('/register')}
            className="px-6 h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition"
          >
            Start for free →
          </button>
          <button
            onClick={scrollToFeatures}
            className="px-6 h-12 border border-white/30 hover:bg-white/5 text-white rounded-xl transition"
          >
            See how it works
          </button>
        </div>
        <p className="text-[13px] text-[#64748B] mt-6">No credit card required • Free forever</p>
      </section>

      {/* Features */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Pencil className="w-5 h-5 text-white" />,
              iconBg: 'bg-indigo-500',
              title: 'Real-time collaboration',
              desc: 'Draw together with your team. See cursors, strokes, and edits live.',
            },
            {
              icon: <Sparkles className="w-5 h-5 text-white" />,
              iconBg: 'bg-purple-500',
              title: 'AI diagram generator',
              desc: "Type 'draw a login flow' and watch shapes appear on your canvas.",
            },
            {
              icon: <Users className="w-5 h-5 text-white" />,
              iconBg: 'bg-teal-500',
              title: 'Multi-user rooms',
              desc: 'Share a link. Anyone joins instantly. No signup required for guests.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition"
            >
              <div className={`w-10 h-10 ${f.iconBg} rounded-full flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#94A3B8]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Canvas preview */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <div className="bg-[#1A1A2E] rounded-2xl h-96 relative overflow-hidden border border-[#1E293B]">
          <svg className="absolute inset-0 w-full h-full">
            <rect x="100" y="80" width="180" height="100" fill="none" stroke="#6366F1" strokeWidth="2" rx="8" />
            <path d="M 300 140 Q 400 90 500 150 T 680 130" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="350" y="210" width="160" height="110" fill="#FEF9C3" rx="8" transform="rotate(-2 430 265)" />
            <text x="372" y="270" fontSize="13" fill="#1E293B">Ideas go here!</text>
          </svg>
          <div className="absolute left-[180px] top-[180px] flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Sarah K.</span>
          </div>
          <div className="absolute left-[480px] top-[260px] flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Alex M.</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/login?demo=true')}
          className="text-sm text-indigo-500 hover:underline mt-4"
        >
          Try the live demo →
        </button>
      </section>
    </div>
  );
}
