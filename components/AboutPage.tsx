
import React, { useState } from 'react';
import { 
  Code, Database, Cpu, Globe, Server, Layers, 
  ChevronDown, ChevronUp, Search, CheckCircle, BarChart, Radio,
  Github, Linkedin, Mail, ArrowLeft, Activity
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore' | 'about') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "How is the microclimate data collected?",
      answer: "We aggregate data from a constellation of sources including public government meteorological stations, commercial IoT sensor networks, and satellite imagery processed via our proprietary ML algorithms to generate hyper-local estimations."
    },
    {
      question: "How often is the data updated?",
      answer: "Our core datasets are updated in real-time (every 1-5 minutes) for sensor-connected locations. Satellite-derived layers are updated hourly or daily depending on orbital passes and processing latency."
    },
    {
      question: "Is there an API available for developers?",
      answer: "Yes, we offer a robust REST API and WebSocket streams for enterprise partners. You can access historical data, real-time feeds, and forecast models. Check our developer portal for documentation."
    }
  ];

  const team = [
    {
      name: "Madhu Tiwari",
      role: "Frontend Developer",
      bio: "Crafting intuitive user interfaces with React and Tailwind."
    },
    {
      name: "Jakt Malhotra",
      role: "Backend Developer",
      bio: "Architecting scalable APIs with Python and FastAPI."
    },
    {
      name: "Vicky Sharma",
      role: "Database Administrator",
      bio: "Optimizing PostGIS queries for massive geospatial datasets."
    },
    {
      name: "Kshitij Vats",
      role: "AI Agent Specialist",
      bio: "Developing advanced AI agents for predictive climate modeling."
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00C2FF] selection:text-black overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00C2FF]/10 blur-[100px] rounded-full opacity-50"></div>
        </div>
        
        <button 
            onClick={() => onNavigate('landing')}
            className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors z-20"
        >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>

        <h1 className="relative z-10 text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          About Microclimate
        </h1>
        <p className="relative z-10 max-w-2xl mx-auto text-lg text-gray-400">
          Discover the mission, technology, and team dedicated to visualizing our world's microclimates with unprecedented precision.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center border-t border-white/5">
        <h2 className="text-3xl font-bold text-white mb-8">Why microclimate matters?</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-[#00C2FF] to-blue-600 mx-auto mb-10 rounded-full"></div>
        <p className="text-lg text-gray-300 leading-relaxed">
          Understanding microclimates is crucial for everything from <span className="text-[#00C2FF] font-medium">urban planning</span> and <span className="text-green-400 font-medium">precision agriculture</span> to <span className="text-blue-400 font-medium">energy efficiency</span> and public health. Our platform provides hyper-local data to empower decision-makers with insights that were previously inaccessible, helping build more <span className="text-purple-400 font-medium">resilient and sustainable communities</span> for the future.
        </p>
      </div>

      {/* Tech Stack */}
      <div className="py-20 bg-[#0B0E14] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">The Technology Powering Our Insights</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00C2FF] to-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Frontend */}
            <div className="bg-[#161B26] p-6 rounded-2xl border border-white/5 hover:border-[#00C2FF]/30 transition-all group">
              <h3 className="text-[#00C2FF] font-bold mb-6 uppercase tracking-wider text-sm">Frontend</h3>
              <div className="flex justify-between mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-[#00C2FF] transition-colors">
                    <Code className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">React</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-[#00C2FF] transition-colors">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Tailwind</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-[#00C2FF] transition-colors">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Mapbox</span>
                </div>
              </div>
            </div>

            {/* Backend */}
            <div className="bg-[#161B26] p-6 rounded-2xl border border-white/5 hover:border-[#00C2FF]/30 transition-all group">
              <h3 className="text-teal-400 font-bold mb-6 uppercase tracking-wider text-sm">Backend</h3>
              <div className="flex justify-between mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-teal-400 transition-colors">
                    <Server className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Python</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-teal-400 transition-colors">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">PostGIS</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-teal-400 transition-colors">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">FastAPI</span>
                </div>
              </div>
            </div>

            {/* AI/ML */}
            <div className="bg-[#161B26] p-6 rounded-2xl border border-white/5 hover:border-[#00C2FF]/30 transition-all group">
              <h3 className="text-purple-400 font-bold mb-6 uppercase tracking-wider text-sm">AI/ML</h3>
              <div className="flex justify-between mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-purple-400 transition-colors">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">TensorFlow</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-purple-400 transition-colors">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">PyTorch</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-purple-400 transition-colors">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Scikit-learn</span>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-[#161B26] p-6 rounded-2xl border border-white/5 hover:border-[#00C2FF]/30 transition-all group">
              <h3 className="text-orange-400 font-bold mb-6 uppercase tracking-wider text-sm">Data Sources</h3>
              <div className="flex justify-between mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-orange-400 transition-colors">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Satellite</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-orange-400 transition-colors">
                    <Radio className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">IoT Sensors</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mb-2 group-hover:text-orange-400 transition-colors">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400">Open Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Meet the Minds Behind the Mission</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00C2FF] to-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <div key={i} className="bg-[#161B26] rounded-2xl p-6 border border-white/5 hover:border-[#00C2FF]/30 transition-all text-center group hover:-translate-y-1 duration-300">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full p-1 bg-gradient-to-br from-[#00C2FF] to-blue-600">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#161B26] bg-[#1E2330] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white group-hover:scale-110 transition-transform">{member.name.charAt(0)}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-sm text-[#00C2FF] font-medium mb-4">{member.role}</p>
                <p className="text-sm text-gray-400 mb-6">{member.bio}</p>
                <div className="flex justify-center space-x-4">
                  <button className="text-gray-500 hover:text-white transition-colors"><Github className="w-4 h-4" /></button>
                  <button className="text-gray-500 hover:text-[#00C2FF] transition-colors"><Linkedin className="w-4 h-4" /></button>
                  <button className="text-gray-500 hover:text-white transition-colors"><Mail className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#00C2FF] to-blue-600 mx-auto rounded-full mb-8"></div>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full bg-[#161B26] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#161B26] rounded-xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-white hover:bg-white/5 transition-colors"
              >
                {faq.question}
                {openFaq === i ? <ChevronUp className="w-5 h-5 text-[#00C2FF]" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-16 bg-[#0B0E14] border-y border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-[#161B26] rounded-2xl p-8 border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Contact Support</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Name</label>
                  <input type="text" className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00C2FF] outline-none transition-colors" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Email</label>
                  <input type="email" className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00C2FF] outline-none transition-colors" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Message</label>
                <textarea rows={4} className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00C2FF] outline-none transition-colors" placeholder="How can we help you?"></textarea>
              </div>
              <div className="text-center">
                <button type="button" className="px-8 py-3 bg-[#00C2FF] hover:bg-[#00A0D6] text-black font-bold rounded-lg transition-colors shadow-lg">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Data Reliability */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-16">Understanding Our Data Reliability</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#161B26] p-8 rounded-2xl border border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-green-500 flex items-center justify-center bg-[#0B0E14]">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-green-500 font-bold text-lg mb-4">Verified</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Direct measurements from ground sensors. Highest confidence level, providing real-time, on-the-ground truth.
              </p>
            </div>

            <div className="bg-[#161B26] p-8 rounded-2xl border border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-yellow-500 flex items-center justify-center bg-[#0B0E14]">
                <BarChart className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-yellow-500 font-bold text-lg mb-4">Estimated</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Data derived from satellite imagery and remote sensing. Highly reliable but not directly measured at the surface.
              </p>
            </div>

            <div className="bg-[#161B26] p-8 rounded-2xl border border-white/5 relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-orange-500 flex items-center justify-center bg-[#0B0E14]">
                <Radio className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-orange-500 font-bold text-lg mb-4">Projected</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI-driven forecasts based on historical data and predictive models. Used for future planning and what-if scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B0E14] border-t border-white/5 py-12 px-4 text-center">
        <p className="text-gray-500 text-sm">© 2024 MicroClimate. All rights reserved.</p>
      </footer>

    </div>
  );
};
