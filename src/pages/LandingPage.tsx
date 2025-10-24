import {
  MessageSquare,
  Video,
  FileText,
  PenTool,
  Zap,
  Users,
  Clock,
  Trophy,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  // Inject styles directly into the document
  const styles = `
    @keyframes glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @keyframes glitch-1 {
      0%, 100% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
    }

    @keyframes glitch-2 {
      0%, 100% { transform: translate(0); }
      25% { transform: translate(1px, -1px); }
      50% { transform: translate(-1px, 1px); }
      75% { transform: translate(1px, 1px); }
    }

    @keyframes pulse-glow {
      0%, 100% { 
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.5),
                    0 0 10px rgba(0, 255, 255, 0.3);
      }
      50% { 
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.8),
                    0 0 20px rgba(0, 255, 255, 0.5),
                    0 0 30px rgba(0, 255, 255, 0.3);
      }
    }

    @keyframes scan-line {
      0% { transform: translateY(0); }
      100% { transform: translateY(100vh); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .gradient-text {
      background: linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #00ffff 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: glow 3s ease-in-out infinite;
    }

    .neon-glow-subtle {
      text-shadow: 0 0 3px #00ffff, 0 0 6px #00ffff;
    }

    .neon-border {
      box-shadow: 0 0 5px #00ffff, inset 0 0 5px #00ffff;
    }

    .cyber-card {
      position: relative;
      animation: float 6s ease-in-out infinite;
    }

    .cyber-card::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #00ffff, #ff00ff, #a855f7, #84cc16);
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;
    }

    .cyber-card:hover::before {
      opacity: 0.3;
    }
  `;

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description:
        "Lightning-fast messaging with your study group. Share ideas, ask questions, and stay connected with zero latency.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
    {
      icon: Video,
      title: "Video Meetings",
      description:
        "Crystal-clear virtual study sessions. HD streaming, screen sharing, and recording built-in.",
      color: "text-[#FF00FF]",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: FileText,
      title: "Collaborative Notes",
      description:
        "Edit notes together in real-time. Markdown support, version history, and instant sync across devices.",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: PenTool,
      title: "Interactive Whiteboards",
      description:
        "Infinite canvas for your ideas. Draw, diagram, and brainstorm with powerful collaboration tools.",
      color: "text-lime-400",
      bgColor: "bg-lime-400/10",
    },
  ];

  const stats = [
    { icon: Users, value: "50K+", label: "Active Students" },
    { icon: Clock, value: "1M+", label: "Study Hours" },
    { icon: Trophy, value: "98%", label: "Success Rate" },
    { icon: Star, value: "4.9/5", label: "User Rating" },
  ];


  const navigate = useNavigate();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div
        className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px),
                         repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)`,
        }}
      >
        {/* Animated scan line effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 animate-[scan-line_4s_linear_infinite]"></div>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-40 relative">
          <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-[100px] animate-pulse"></div>
          <div
            className="absolute bottom-20 left-20 w-72 h-72 bg-[#FF00FF] rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-block px-4 py-2 border border-cyan-400/50 rounded-full mb-4 animate-pulse">
              <span className="text-cyan-400 text-sm font-mono">
                // NEXT-GEN COLLABORATION
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
              <span className="gradient-text neon-glow-subtle block mb-4">
                StudyHive
              </span>
              <span className="text-4xl md:text-5xl block text-foreground/90">
                Your Cybernetic Study Space
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Harness the power of{" "}
              <span className="text-cyan-400 font-semibold">
                real-time collaboration
              </span>{" "}
              with cutting-edge tech. Chat, meet, create, and dominate your
              studies in the digital realm.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-black px-10 py-7 text-lg font-bold transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] border-0"
              >
                <Zap className="mr-2 h-5 w-5" />
                Sign Up Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/sign-in")}
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-10 py-7 text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              >
                Log In
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colors = [
                "from-cyan-400 to-blue-500",
                "from-fuchsia-400 to-pink-500",
                "from-emerald-400 to-teal-500",
                "from-amber-400 to-orange-500",
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={index}
                  className={`relative rounded-xl p-6 text-center group transition-all duration-300 border border-cyan-400/30 bg-gradient-to-b from-gray-900 to-gray-800 hover:shadow-[0_0_35px_rgba(0,255,255,0.25)] hover:border-transparent`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-r ${color} text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-mono tracking-wide uppercase">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="text-cyan-400">Cyber-Enhanced</span> Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Four powerful tools, one unified platform. Everything you need
                to dominate your studies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group bg-purple-50 border-2 border-cyan-400/20 rounded-lg p-8 transition-all duration-500 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(0,255,255,0.3)] relative cyber-card overflow-hidden"
                    style={{
                      animationDelay: `${index * 0.15}s`,
                    }}
                  >
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/50 group-hover:border-cyan-400 transition-colors"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/50 group-hover:border-cyan-400 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/50 group-hover:border-cyan-400 transition-colors"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/50 group-hover:border-cyan-400 transition-colors"></div>

                    <div className="flex items-start space-x-4 relative z-10">
                      <div
                        className={`p-4 ${feature.bgColor} rounded-lg group-hover:scale-110 transition-all duration-300 border border-cyan-400/30 group-hover:border-cyan-400`}
                      >
                        <Icon className={`w-7 h-7 ${feature.color}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-[#0a0a0a] text-center relative overflow-hidden">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">
              StudyHive?
            </span>
          </h2>
          <p className="text-gray-400 mb-16">
            Built for the future of education with cutting-edge technology
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {[
              {
                title: "Lightning Fast",
                desc: "Optimized performance ensures zero lag during your most critical study sessions.",
                icon: "⚡",
                color: "from-yellow-400 to-amber-500",
              },
              {
                title: "Secure & Private",
                desc: "End-to-end encryption keeps your conversations and notes completely private.",
                icon: "🔒",
                color: "from-emerald-400 to-teal-500",
              },
              {
                title: "AI-Powered",
                desc: "Smart features like auto-summaries and intelligent search help you study smarter.",
                icon: "🤖",
                color: "from-fuchsia-500 to-cyan-400",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-transparent hover:shadow-[0_0_25px_var(--tw-gradient-from)] transition-all duration-300"
              >
                <div
                  className={`text-5xl mb-4 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-[#FF00FF] blur-3xl"></div>

            {/* Card */}
            <div className="relative bg-[#ffffff0a] border-4 border-cyan-400/40 rounded-2xl p-12 md:p-16 text-center overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.2)] backdrop-blur-md">
              {/* Animated brackets */}
              <div className="absolute top-4 left-4 text-cyan-400 text-6xl font-mono animate-pulse">
                [
              </div>
              <div className="absolute top-4 right-4 text-cyan-400 text-6xl font-mono animate-pulse">
                ]
              </div>
              <div className="absolute bottom-4 left-4 text-[#FF00FF] text-6xl font-mono animate-pulse">
                [
              </div>
              <div className="absolute bottom-4 right-4 text-[#FF00FF] text-6xl font-mono animate-pulse">
                ]
              </div>

              {/* Text */}
              <h2 className="text-4xl md:text-6xl font-bold relative z-10 leading-tight">
                Ready to <span className="gradient-text">level up</span>
                <br />
                your study game?
              </h2>

              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-4 relative z-10">
                Join <span className="text-cyan-400 font-bold">50,000+</span>{" "}
                students who are already crushing their goals with{" "}
                <span className="text-purple-400 font-semibold">StudyHive</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 relative z-10">
                <Button
                  size="lg"
                  onClick={() => navigate("/sign-up")}
                  className="bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-black px-12 py-6 text-lg font-bold transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_50px_rgba(0,255,255,0.8)] border-0"
                >
                  Start Free Today
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#FF00FF] text-[#FF00FF] hover:bg-[#FF00FF] px-12 py-6 text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,255,0.5)]"
                >
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t-2 border-cyan-400/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-cyan-400 font-bold text-lg font-mono">
                  // STUDYHIVE
                </h3>
                <p className="text-sm text-muted-foreground">
                  Next-generation collaboration platform for students
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-foreground font-semibold">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Features
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Pricing
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Security
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-foreground font-semibold">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    About
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Careers
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Contact
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-foreground font-semibold">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Documentation
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Community
                  </li>
                  <li className="hover:text-cyan-400 cursor-pointer transition-colors">
                    Support
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-cyan-400/20 text-center">
              <p className="text-sm text-muted-foreground font-mono">
                © 2025 <span className="text-cyan-400">StudyHive</span>. All
                rights reserved.
                <span className="ml-4">// Built for the future</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
