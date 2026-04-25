import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Video,
  FileText,
  PenTool,
  Users,
  Search,
  CheckCircle2,
  Menu,
  X,
  Play,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Index = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* 1. Navbar */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5" : "bg-transparent pt-4"
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="font-bold text-xl tracking-tight">StudyHive</span>
            </div>

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#resources" className="hover:text-white transition-colors">Resources</a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-white hover:bg-white/5"
                onClick={() => navigate("/sign-in")}
              >
                Log In
              </Button>
              <Button 
                className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-medium shadow-lg shadow-white/10 transition-all hover:scale-105"
                onClick={() => navigate("/sign-up")}
              >
                Get Started Free
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#111113] border-b border-white/5 overflow-hidden"
            >
              <div className="flex flex-col px-6 py-4 space-y-4">
                <a href="#features" className="text-slate-300 py-2 border-b border-white/5">Product</a>
                <a href="#how-it-works" className="text-slate-300 py-2 border-b border-white/5">Features</a>
                <a href="#pricing" className="text-slate-300 py-2 border-b border-white/5">Pricing</a>
                <Button variant="outline" className="w-full mt-4 border-white/10 bg-transparent text-white hover:bg-white/5" onClick={() => navigate("/sign-in")}>Log In</Button>
                <Button className="w-full bg-white text-black hover:bg-slate-200" onClick={() => navigate("/sign-up")}>Get Started Free</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Subtle Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto space-y-8"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Introducing StudyHive 2.0
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                The smarter way to <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  study together.
                </span>
              </motion.h1>

              <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                StudyHive helps students chat, meet, write notes, and brainstorm together in one seamless platform. Built for the modern study group.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-black hover:bg-slate-200 rounded-full px-8 py-6 text-lg font-medium shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
                  onClick={() => navigate("/sign-up")}
                >
                  Start Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-full px-8 py-6 text-lg font-medium border-white/10 bg-transparent text-white hover:bg-white/5 group"
                >
                  <Play className="w-5 h-5 mr-2 text-slate-400 group-hover:text-white transition-colors" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Visual Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent blur-2xl rounded-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-[#111113]/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center">
                {/* Abstract mockup representation */}
                <div className="w-full h-full flex flex-col">
                  {/* Mockup Header */}
                  <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0A0A0B]/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-red-500 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-yellow-500 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-green-500 transition-colors cursor-pointer" />
                    </div>
                    <div className="ml-4 flex-1 h-6 bg-white/5 rounded border border-white/5 flex items-center px-3 max-w-md">
                      <Search className="w-3 h-3 text-slate-500 mr-2" />
                      <div className="h-2 w-24 bg-white/10 rounded" />
                    </div>
                  </div>
                  {/* Mockup Body */}
                  <div className="flex-1 flex p-4 gap-4 bg-[#0A0A0B]/20">
                    {/* Sidebar */}
                    <div className="hidden sm:flex w-48 rounded-lg bg-white/5 border border-white/5 p-3 flex-col gap-4">
                       <div>
                         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Study Groups</div>
                         <div className="flex items-center gap-2 mb-2 p-1.5 bg-white/5 rounded cursor-pointer">
                           <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                             <Users className="w-3 h-3" />
                           </div>
                           <div className="h-2.5 w-20 bg-white/20 rounded"></div>
                         </div>
                         <div className="flex items-center gap-2 mb-2 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
                           <div className="w-5 h-5 rounded flex items-center justify-center bg-purple-500/20 text-purple-400">
                             <Users className="w-3 h-3" />
                           </div>
                           <div className="h-2.5 w-24 bg-white/10 rounded"></div>
                         </div>
                       </div>
                       
                       <div>
                         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Direct Messages</div>
                         <div className="flex items-center gap-2 mb-2 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
                           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
                           <div className="h-2.5 w-16 bg-white/10 rounded"></div>
                         </div>
                         <div className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
                           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-red-500" />
                           <div className="h-2.5 w-20 bg-white/10 rounded"></div>
                         </div>
                       </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                      {/* Video feeds */}
                      <div className="h-32 sm:h-40 rounded-lg bg-[#0A0A0B] border border-white/5 p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                         {[...Array(4)].map((_, i) => (
                           <div key={i} className="bg-[#151518] rounded-md border border-white/5 flex items-center justify-center relative overflow-hidden group">
                              {i === 0 && <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />}
                              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm text-indigo-300 border border-indigo-500/30">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-slate-300 flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-red-500' : 'bg-green-500'}`} />
                                Student {i+1}
                              </div>
                           </div>
                         ))}
                      </div>
                      {/* Bottom area split: Chat & Notes */}
                      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                         {/* Chat */}
                         <div className="flex-1 rounded-lg bg-[#0A0A0B] border border-white/5 p-3 flex flex-col min-h-0">
                           <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-xs font-medium text-slate-300">Group Chat</span>
                           </div>
                           <div className="flex-1 overflow-hidden flex flex-col justify-end gap-3 pb-2">
                             <div className="flex items-end gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/30 shrink-0" />
                                <div className="bg-white/5 border border-white/5 text-slate-300 p-2 rounded-xl rounded-bl-sm text-[10px] w-5/6 shadow-sm">Hey, did anyone finish the physics assignment?</div>
                             </div>
                             <div className="flex items-end gap-2 self-end flex-row-reverse">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/30 shrink-0" />
                                <div className="bg-indigo-500 text-white p-2 rounded-xl rounded-br-sm text-[10px] w-5/6 shadow-sm">Almost done! Just stuck on question 4. Let's solve it together.</div>
                             </div>
                           </div>
                           <div className="h-8 mt-2 rounded bg-white/5 border border-white/5 flex items-center px-2">
                             <div className="h-2 w-32 bg-white/10 rounded" />
                           </div>
                         </div>
                         {/* Notes */}
                         <div className="flex-[1.5] rounded-lg bg-[#0A0A0B] border border-white/5 p-4 flex flex-col min-h-0 hidden sm:flex">
                           <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-xs font-medium text-slate-300">Physics_Notes_Ch4.md</span>
                              </div>
                              <div className="flex gap-[-4px]">
                                <div className="w-4 h-4 rounded-full bg-indigo-500 border border-[#0A0A0B] z-10" />
                                <div className="w-4 h-4 rounded-full bg-cyan-500 border border-[#0A0A0B] -ml-1.5" />
                              </div>
                           </div>
                           <div className="space-y-3 flex-1 overflow-hidden">
                             <div className="h-3 w-1/3 bg-white/20 rounded" />
                             <div className="space-y-1.5 pt-1">
                               <div className="h-2 w-full bg-white/5 rounded" />
                               <div className="h-2 w-full bg-white/5 rounded" />
                               <div className="h-2 w-5/6 bg-white/5 rounded" />
                             </div>
                             <div className="h-2 w-1/4 bg-white/10 rounded mt-3" />
                             <div className="space-y-1.5 pt-1">
                               <div className="h-2 w-full bg-white/5 rounded" />
                               <div className="flex items-center gap-1">
                                 <div className="h-2 w-2/3 bg-white/5 rounded" />
                                 <div className="h-3 w-0.5 bg-cyan-400 animate-pulse" /> {/* Fake cursor */}
                               </div>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats over Mockup */}
                <div className="absolute -left-6 top-1/4 bg-[#1A1A1D] border border-white/10 rounded-xl p-4 shadow-xl backdrop-blur-md hidden lg:block animate-[float_4s_ease-in-out_infinite]">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg"><Users className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Active Students</p>
                      <p className="text-xl font-bold text-white">50K+</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-6 bottom-1/3 bg-[#1A1A1D] border border-white/10 rounded-xl p-4 shadow-xl backdrop-blur-md hidden lg:block animate-[float_5s_ease-in-out_infinite_reverse]">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-2 rounded-lg"><Star className="w-5 h-5 text-cyan-400" fill="currentColor" /></div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Satisfaction</p>
                      <p className="text-xl font-bold text-white">98%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Trusted By */}
        <section className="py-12 border-y border-white/5 bg-[#0A0A0B]">
          <div className="container mx-auto px-6 max-w-7xl text-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">Trusted by students at top institutions</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholder Logos */}
              <div className="text-xl font-bold font-serif">Stanford</div>
              <div className="text-xl font-bold font-serif tracking-tighter">MIT</div>
              <div className="text-xl font-bold font-serif">Harvard</div>
              <div className="text-xl font-bold font-sans">Berkeley</div>
              <div className="text-xl font-bold font-serif">Oxford</div>
            </div>
          </div>
        </section>

        {/* 4. Features Section */}
        <section id="features" className="py-24 relative">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              className="mb-16 md:mb-24"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Everything you need. <br />
                <span className="text-slate-500">Nothing you don't.</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl">
                Replace your fragmented toolstack. StudyHive brings together chat, video, notes, and whiteboards into one unified, lightning-fast workspace.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: MessageSquare, title: "Real-Time Chat", desc: "Fast messaging for study groups and class discussions. Threaded replies and reactions." },
                { icon: Video, title: "HD Video Meetings", desc: "Run distraction-free study sessions with crystal clear video and screen sharing." },
                { icon: FileText, title: "Collaborative Notes", desc: "Write together in real time with synced notes, markdown support, and live cursors." },
                { icon: PenTool, title: "Interactive Whiteboards", desc: "Visualize ideas, solve complex equations, and brainstorm concepts on an infinite canvas." },
                { icon: Users, title: "Group Management", desc: "Create private or public study circles with granular role controls and permissions." },
                { icon: Search, title: "Smart Search & AI", desc: "Find notes, chats, and summaries instantly across your entire workspace." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }
                  }}
                  className="bg-[#111113] border border-white/5 rounded-2xl p-8 hover:bg-[#151518] hover:border-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-100 mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Why Choose StudyHive */}
        <section className="py-24 bg-[#0A0A0B] relative overflow-hidden border-y border-white/5">
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
           
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                  Designed exclusively <br/> for the way you study.
                </motion.h2>
                
                <div className="space-y-6">
                  {[
                    "Everything in one unified platform",
                    "No contextual switching between apps",
                    "Optimized for academic workflows",
                    "End-to-end secure and private",
                    "Blazing fast and reliable",
                    "Syncs seamlessly across all devices"
                  ].map((item, i) => (
                    <motion.div variants={fadeIn} key={i} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-lg text-slate-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="rounded-2xl border border-white/10 bg-[#111113] p-2 shadow-2xl relative z-10">
                   <div className="rounded-xl border border-white/5 bg-[#151518] aspect-[4/3] flex flex-col overflow-hidden">
                      <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#1A1A1D]">
                         <div className="text-xs font-medium text-slate-400">Study Group: Advanced Physics</div>
                      </div>
                      <div className="flex-1 flex relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                        {/* Placeholder UI */}
                        <div className="w-1/3 border-r border-white/5 p-4 space-y-3">
                           <div className="h-8 bg-white/5 rounded-md flex items-center px-3 gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500/50"/><div className="h-2 w-12 bg-white/20 rounded"/></div>
                           <div className="h-8 bg-white/5 rounded-md flex items-center px-3 gap-2"><div className="w-3 h-3 rounded-full bg-purple-500/50"/><div className="h-2 w-16 bg-white/20 rounded"/></div>
                           <div className="h-8 bg-white/5 rounded-md flex items-center px-3 gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500/50"/><div className="h-2 w-10 bg-white/20 rounded"/></div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col">
                           <div className="flex items-center gap-2 mb-4">
                              <PenTool className="w-5 h-5 text-indigo-400" />
                              <div className="h-4 w-32 bg-white/10 rounded" />
                           </div>
                           <div className="flex-1 bg-white/5 rounded-lg border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                              {/* Fake whiteboard content */}
                              <div className="absolute w-24 h-16 border-2 border-indigo-500/30 rounded-lg top-4 left-4" />
                              <div className="absolute w-16 h-16 border-2 border-purple-500/30 rounded-full bottom-4 right-8" />
                              <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                                <path d="M50 50 Q 150 150 200 50 T 350 100" stroke="cyan" strokeWidth="2" fill="none" />
                              </svg>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
                {/* Decorative blob behind screenshot */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-2xl -z-10 rounded-3xl opacity-50" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Start studying in seconds</h2>
              <p className="text-slate-400 text-lg">A frictionless workflow designed for momentum.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
              
              {[
                { step: "01", title: "Create workspace", desc: "Sign up and create a dedicated workspace for your classes or study groups." },
                { step: "02", title: "Invite your group", desc: "Share a simple link to bring your peers into the collaborative environment." },
                { step: "03", title: "Collaborate & succeed", desc: "Start chatting, taking shared notes, and jumping into instant video calls." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-[#111113] border border-white/10 flex items-center justify-center text-2xl font-mono text-indigo-400 mb-6 shadow-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Testimonials */}
        <section className="py-24 bg-[#111113] border-y border-white/5">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Loved by top students</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "StudyHive replaced 4 different apps for our engineering project team. It's incredibly fast and the shared whiteboard is a lifesaver.", author: "Sarah J.", role: "Computer Science Major" },
                { quote: "We improved our group productivity massively. The ability to jump from a chat straight into an HD video call with synced notes is magic.", author: "Michael T.", role: "Medical Student" },
                { quote: "Easily the best platform for remote studying. It feels like a premium startup tool but designed specifically for academic needs.", author: "Elena R.", role: "Law Student" }
              ].map((testimonial, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#151518] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all"
                >
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 text-indigo-500" fill="currentColor" />)}
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-medium text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Pricing Preview */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-slate-400 text-lg">Start for free, upgrade when your team needs more power.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 flex flex-col">
                <h3 className="text-xl font-medium text-slate-300 mb-2">Free</h3>
                <div className="mb-6"><span className="text-4xl font-bold">$0</span><span className="text-slate-500">/forever</span></div>
                <p className="text-slate-400 text-sm mb-8">Perfect for individual students and small study groups.</p>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Up to 5 group members", "Unlimited chat messages", "1 hr video limit", "Basic collaborative notes"].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-white/10 bg-transparent text-white hover:bg-white/5">Get Started</Button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-b from-[#1A1A24] to-[#111113] border border-indigo-500/30 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
                <h3 className="text-xl font-medium text-indigo-400 mb-2">Pro</h3>
                <div className="mb-6"><span className="text-4xl font-bold">$8</span><span className="text-slate-500">/mo</span></div>
                <p className="text-slate-400 text-sm mb-8">For serious students who need limitless collaboration.</p>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Unlimited group members", "Unlimited HD video", "Advanced whiteboard tools", "AI smart search & summaries"].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white">Upgrade to Pro</Button>
              </div>

              {/* Campus Plan */}
              <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 flex flex-col">
                <h3 className="text-xl font-medium text-slate-300 mb-2">Campus</h3>
                <div className="mb-6"><span className="text-4xl font-bold">Custom</span></div>
                <p className="text-slate-400 text-sm mb-8">For university departments and large organizations.</p>
                <ul className="space-y-4 mb-8 flex-1">
                  {["SSO integration", "Dedicated success manager", "Advanced analytics", "Custom domain"].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-white/10 bg-transparent text-white hover:bg-white/5">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Final CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1/2 bg-indigo-500/20 blur-[120px] rounded-t-full pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Ready to level up <br/> your study game?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-400 mb-10"
            >
              Join thousands of students already using StudyHive to collaborate better.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-slate-200 rounded-full px-10 py-6 text-lg font-medium shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
                onClick={() => navigate("/sign-up")}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-10 py-6 text-lg font-medium border-white/10 bg-transparent text-white hover:bg-white/5"
              >
                Book a Demo
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0B] pt-16 pb-8">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="font-bold text-lg">StudyHive</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs">
                The all-in-one collaborative workspace for the next generation of students.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} StudyHive Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              {/* Social Placeholders */}
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors" />
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors" />
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
};

export default Index;

