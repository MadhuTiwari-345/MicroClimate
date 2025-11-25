
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Search, Bell, BarChart2, FileText, ChevronDown, MapPin, Loader2,
  PieChart, Download, Calendar, File, Filter, ArrowLeft, Plus, X, Globe,
  TrendingUp, Mail, Smartphone, Thermometer, Droplets, Wind, Activity, Check,
  Tornado, User, ExternalLink, Bookmark, Share2
} from 'lucide-react';
import { UserData } from '../App';
import { getGlobalWeatherEvents, getClimateUpdates, getArticleDetails, generateClimateReport } from '../services/locationservice';

interface AlertsPageProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'explore') => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  user: UserData | null;
}

interface Alert {
  id: number;
  severity: 'critical' | 'high' | 'moderate' | 'info';
  title: string;
  location: string;
  lat: number;
  lon: number;
  time: string;
  type: string;
}

interface Article {
  id: number;
  title: string;
  source: string;
  date: string;
  summary: string;
  category: string;
  imageUrl: string;
  content?: string;
}

interface Report {
  name: string;
  date: string;
  size: string;
  type: string;
  content?: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate, onLocationSelect, user }) => {
  // Tabs: 'updates' (News), 'monitor' (Live Alerts), 'analytics', 'reports'
  const [activeTab, setActiveTab] = useState<'updates' | 'monitor' | 'analytics' | 'reports'>('updates');
  const [loading, setLoading] = useState(false);
  
  // Alert Monitor State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Climate Updates State
  const [newsCategory, setNewsCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  
  // Create Alert Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertMetric, setAlertMetric] = useState('Temperature');
  const [alertValue, setAlertValue] = useState('25');
  const [alertLocation, setAlertLocation] = useState('Midtown, Manhattan');

  // Reports State
  const [reports, setReports] = useState<Report[]>([
    { name: 'Q3 Global Climate Summary', date: 'Oct 15, 2023', size: '2.4 MB', type: 'PDF', content: 'Summary of Q3 Climate Data...' },
    { name: 'Pacific Typhoon Analysis', date: 'Oct 12, 2023', size: '1.8 MB', type: 'PDF', content: 'Analysis of Typhoon trends...' },
    { name: 'Urban Heat Island Data Export', date: 'Oct 10, 2023', size: '15.2 MB', type: 'CSV', content: 'Raw data export...' },
  ]);
  const [generatingReport, setGeneratingReport] = useState(false);

  const sidebarItems = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutGrid, action: () => onNavigate('dashboard') },
    { name: 'Explore', id: 'explore', icon: Search, action: () => onNavigate('explore') },
    { name: 'Climate Updates', id: 'updates', icon: Globe, action: () => setActiveTab('updates') },
    { name: 'Global Monitor', id: 'monitor', icon: Bell, action: () => setActiveTab('monitor') },
    { name: 'Analytics', id: 'analytics', icon: BarChart2, action: () => setActiveTab('analytics') },
    { name: 'Reports', id: 'reports', icon: FileText, action: () => setActiveTab('reports') },
  ];

  const showToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  };

  // Load Saved Articles from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedArticles');
    if (saved) {
      try {
        setSavedArticles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved articles");
      }
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      const data = await getGlobalWeatherEvents();
      if (data && data.length > 0) {
        setAlerts(data);
      }
      setLoading(false);
    };
    loadAlerts();
  }, []);

  // News Fetching
  useEffect(() => {
    if (activeTab === 'updates') {
        if (newsCategory === 'Saved') {
          setArticles(savedArticles);
          return;
        }

        const fetchNews = async () => {
            setLoadingNews(true);
            const data = await getClimateUpdates(newsCategory === 'All' ? 'General Climate Science' : newsCategory);
            setArticles(data);
            setLoadingNews(false);
        };
        fetchNews();
    }
  }, [activeTab, newsCategory, savedArticles]);

  // Article Detail Fetching
  useEffect(() => {
      if (selectedArticle) {
          const fetchDetail = async () => {
              setLoadingArticle(true);
              setArticleContent('');
              // Check if content is already locally available (mock) or needs fetch
              const content = await getArticleDetails(selectedArticle.title);
              setArticleContent(content);
              setLoadingArticle(false);
          };
          fetchDetail();
      }
  }, [selectedArticle]);

  const handleSaveArticle = (article: Article) => {
    setSavedArticles(prev => {
      if (prev.some(a => a.id === article.id)) return prev;
      const updated = [article, ...prev];
      localStorage.setItem('savedArticles', JSON.stringify(updated));
      return updated;
    });
    showToast("Article saved for later");
  };

  const handleShareArticle = (article: Article) => {
    const text = `${article.title} - Read more at MicroClimate`;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Link copied to clipboard");
    });
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    showToast("Analyzing data and generating report...");
    const result = await generateClimateReport();
    if (result) {
      const newReport: Report = {
        name: result.title,
        date: result.date,
        size: result.size,
        type: 'TXT',
        content: result.content
      };
      setReports(prev => [newReport, ...prev]);
      showToast("New report generated successfully!");
    } else {
      showToast("Failed to generate report.");
    }
    setGeneratingReport(false);
  };

  const handleDownloadReport = (report: Report) => {
    const element = document.createElement("a");
    const file = new Blob([report.content || "No content available."], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${report.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    showToast(`Downloading ${report.name}...`);
  };

  const getAlertStyle = (severity: string) => {
      switch(severity) {
          case 'critical': return { glow: 'shadow-[0_0_15px_#ef4444]', bar: 'bg-red-500', icon: Tornado, iconColor: 'text-red-500', iconBg: 'bg-red-500/10' };
          case 'high': return { glow: 'shadow-[0_0_15px_#f97316]', bar: 'bg-orange-500', icon: Thermometer, iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' };
          case 'moderate': return { glow: 'shadow-[0_0_15px_#06b6d4]', bar: 'bg-cyan-500', icon: Activity, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10' };
          default: return { glow: 'shadow-[0_0_10px_#94a3b8]', bar: 'bg-gray-400', icon: Wind, iconColor: 'text-white', iconBg: 'bg-gray-700' };
      }
  };

  const handleExplore = (lat: number, lon: number) => {
      if (onLocationSelect) onLocationSelect(lat, lon);
      onNavigate('explore');
  };

  const filteredAlerts = alerts.filter(alert => {
      const matchSeverity = severityFilter === 'All' || alert.severity === severityFilter.toLowerCase();
      const matchType = typeFilter === 'All' || alert.type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchSeverity && matchType;
  });

  const getArticleImage = (category: string, i: number) => {
      // Deterministic placeholder images based on category
      const images = {
          'Oceanography': [
              'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1582967788606-a171f1080ca8?auto=format&fit=crop&q=80&w=800'
          ],
          'Policy': [
              'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1541872703-74c5963631df?auto=format&fit=crop&q=80&w=800'
          ],
          'Renewable Energy': [
              'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'
          ],
          'Atmospheric Science': [
              'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&q=80&w=800'
          ]
      };
      const catImages = images[category as keyof typeof images] || [
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0?auto=format&fit=crop&q=80&w=800'
      ];
      return catImages[i % catImages.length];
  };

  // --- View Renderers ---

  const renderUpdatesView = () => (
    <div className="animate-fade-in">
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Global Climate Updates</h1>
            <p className="text-gray-400">The latest in climate science, policy, and environmental news.</p>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {['All', 'Oceanography', 'Atmospheric Science', 'Renewable Energy', 'Policy', 'Saved'].map((cat, i) => (
                <button 
                    key={cat} 
                    onClick={() => setNewsCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${newsCategory === cat ? 'bg-[#00C2FF] text-black' : 'bg-[#161B26] text-gray-400 hover:text-white hover:bg-[#1E2330]'}`}
                >
                    {cat === 'Saved' && <Bookmark className="w-3 h-3 mr-2 inline-block" />}
                    {cat}
                </button>
            ))}
        </div>

        {/* News Grid */}
        {loadingNews ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
            </div>
        ) : articles.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No articles found in this category.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {articles.map((article, i) => (
                    <div key={i} className="bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden hover:border-[#00C2FF]/50 transition-all group flex flex-col">
                        <div className="h-48 bg-gray-800 relative p-6 flex flex-col justify-end">
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity"
                                style={{ backgroundImage: `url(${article.imageUrl || getArticleImage(article.category, article.id)})` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent"></div>
                            <div className="relative z-10">
                                <span className="px-2 py-1 bg-[#00C2FF]/20 text-[#00C2FF] text-[10px] font-bold uppercase rounded mb-2 inline-block backdrop-blur-sm">
                                    {article.category}
                                </span>
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#00C2FF] transition-colors">
                                    {article.title}
                                </h3>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center text-xs text-gray-500 mb-4">
                                <span className="font-semibold text-gray-300">{article.source}</span>
                                <span className="mx-2">•</span>
                                <span>{article.date}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-3 flex-1">
                                {article.summary}
                            </p>
                            <button 
                                onClick={() => setSelectedArticle(article)}
                                className="text-sm font-bold text-[#00C2FF] flex items-center hover:underline mt-auto"
                            >
                                Read Full Article <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {newsCategory !== 'Saved' && articles.length > 0 && (
            <div className="mt-8 text-center">
                <button 
                    onClick={() => showToast("Loading more articles...")}
                    className="px-6 py-3 bg-[#161B26] hover:bg-[#1E2330] text-white font-medium rounded-lg transition-colors"
                >
                    Load More Articles...
                </button>
            </div>
        )}
    </div>
  );

  const renderMonitorView = () => (
      <div className="animate-fade-in">
        <div className="mb-10 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold mb-2">Global Event Monitor</h1>
                <p className="text-gray-400">Real-time tracking of significant global weather events.</p>
            </div>
            <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-3 bg-[#00C2FF] text-black font-bold rounded-lg hover:bg-[#00A0D6] transition-colors shadow-[0_0_15px_rgba(0,194,255,0.3)]"
            >
                <Plus className="w-5 h-5 mr-2" />
                Create New Alert
            </button>
        </div>

        <div className="flex items-center space-x-4 mb-10">
            <div className="relative">
                <select 
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-[#161B26] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#1E2330] transition-colors focus:outline-none focus:border-[#00C2FF]"
                >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Info">Informational</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-[#161B26] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#1E2330] transition-colors focus:outline-none focus:border-[#00C2FF]"
                >
                    <option value="All">All Event Types</option>
                    <option value="Storm">Storms / Hurricanes</option>
                    <option value="Heat">Heatwaves</option>
                    <option value="Air">Air Quality</option>
                    <option value="Quake">Seismic</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
            </div>
        </div>

        <div className="space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin mb-4" />
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="text-gray-500 text-center py-10">No alerts match your filters.</div>
            ) : (
                filteredAlerts.map((alert) => {
                    const style = getAlertStyle(alert.severity);
                    return (
                        <div 
                            key={alert.id} 
                            className="group relative bg-[#0B0E14] border border-white/5 rounded-xl p-6 flex items-center hover:bg-[#11141A] transition-all animate-fade-in"
                        >
                            <div className={`w-1.5 h-12 rounded-full ${style.bar} ${style.glow} mr-6 transition-shadow duration-500`}></div>
                            
                            <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center mr-6 shrink-0`}>
                                <style.icon className={`w-6 h-6 ${style.iconColor}`} />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00C2FF] transition-colors">{alert.title}</h3>
                                <p className="text-[#00C2FF] text-sm flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> {alert.location}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-2">{alert.time}</p>
                                <button 
                                  onClick={() => handleExplore(alert.lat, alert.lon)}
                                  className="text-sm font-medium text-white hover:text-[#00C2FF] flex items-center justify-end transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
                                >
                                    Explore on Map
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
  );

  const renderAnalyticsView = () => (
      <div className="animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Event Analytics</h1>
            <p className="text-gray-400">Statistical breakdown of global climate anomalies.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Severity Distribution */}
              <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <PieChart className="w-5 h-5 mr-2 text-[#00C2FF]" /> 
                      Severity Distribution
                  </h3>
                  <div className="space-y-4">
                      {[
                          { label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length || 1, color: 'bg-red-500', width: '15%' },
                          { label: 'High', count: alerts.filter(a => a.severity === 'high').length || 2, color: 'bg-orange-500', width: '35%' },
                          { label: 'Moderate', count: alerts.filter(a => a.severity === 'moderate').length || 3, color: 'bg-cyan-500', width: '40%' },
                          { label: 'Informational', count: alerts.filter(a => a.severity === 'info').length || 1, color: 'bg-gray-500', width: '10%' },
                      ].map((stat) => (
                          <div key={stat.label}>
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-300">{stat.label}</span>
                                  <span className="text-white font-mono">{stat.count}</span>
                              </div>
                              <div className="w-full h-2 bg-[#161B26] rounded-full overflow-hidden">
                                  <div className={`h-full ${stat.color}`} style={{ width: stat.width }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              {/* Event Types */}
              <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-6 h-80">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <BarChart2 className="w-5 h-5 mr-2 text-[#00C2FF]" />
                      Events by Type
                  </h3>
                  <div className="flex items-end justify-between h-48 px-4 pt-4 border-b border-white/10">
                      {[
                          { label: 'Storms', height: '80%', color: 'bg-blue-500' },
                          { label: 'Heat', height: '60%', color: 'bg-orange-500' },
                          { label: 'Air', height: '40%', color: 'bg-purple-500' },
                          { label: 'Quake', height: '20%', color: 'bg-yellow-500' },
                          { label: 'Other', height: '30%', color: 'bg-gray-500' },
                      ].map((item) => (
                          <div key={item.label} className="flex flex-col items-center w-12 group h-full justify-end">
                               <div className="relative w-full flex items-end h-full">
                                   <div 
                                      className={`w-full rounded-t-lg ${item.color} opacity-80 group-hover:opacity-100 transition-all duration-500`} 
                                      style={{ height: item.height }}
                                   ></div>
                               </div>
                               <span className="text-xs text-gray-500 mt-2">{item.label}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderReportsView = () => (
      <div className="animate-fade-in">
          <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold mb-2">Climate Reports</h1>
                <p className="text-gray-400">Download generated summaries and analysis documents.</p>
            </div>
            <button 
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-6 py-3 bg-[#00C2FF] text-black font-bold rounded-lg hover:bg-[#00A0D6] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {generatingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                {generatingReport ? "Generating..." : "Generate Report"}
            </button>
          </div>
          <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden">
              {reports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-[#161B26] transition-colors group">
                      <div className="flex items-center">
                          <div className="w-12 h-12 bg-[#1E2330] rounded-lg flex items-center justify-center mr-4 group-hover:bg-[#00C2FF]/10 transition-colors">
                              <File className={`w-6 h-6 ${report.type === 'CSV' ? 'text-green-400' : report.type === 'TXT' ? 'text-blue-400' : 'text-red-400'}`} />
                          </div>
                          <div>
                              <h3 className="text-white font-bold group-hover:text-[#00C2FF] transition-colors">{report.name}</h3>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <Calendar className="w-3 h-3 mr-1" /> {report.date} • {report.size} • {report.type}
                              </p>
                          </div>
                      </div>
                      <button 
                          onClick={() => handleDownloadReport(report)}
                          className="p-3 rounded-lg text-gray-400 hover:text-[#00C2FF] hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                      >
                          <Download className="w-5 h-5" />
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      {/* Toast */}
      {toast && (
           <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] bg-[#0B0E14]/90 border border-[#00C2FF]/30 text-[#00C2FF] px-6 py-3 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(0,194,255,0.2)] animate-fade-in-up flex items-center">
               <Check className="w-4 h-4 mr-2" />
               {toast}
           </div>
      )}

      {/* Article Details Modal */}
      {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-[#0B0E14] border border-white/10 rounded-2xl max-w-3xl w-full h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                   <div className="relative h-64 shrink-0">
                        <img src={selectedArticle.imageUrl || getArticleImage(selectedArticle.category, selectedArticle.id)} alt={selectedArticle.title} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-6">
                            <span className="px-2 py-1 bg-[#00C2FF]/20 text-[#00C2FF] text-xs font-bold uppercase rounded mb-2 inline-block">{selectedArticle.category}</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">{selectedArticle.title}</h2>
                            <p className="text-sm text-gray-300">{selectedArticle.source} • {selectedArticle.date}</p>
                        </div>
                        <button 
                            onClick={() => setSelectedArticle(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                       {loadingArticle ? (
                           <div className="flex flex-col items-center justify-center h-40 space-y-4">
                               <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
                               <p className="text-gray-400 text-sm animate-pulse">Retrieving article content...</p>
                           </div>
                       ) : (
                           <div className="prose prose-invert max-w-none">
                               <p className="text-lg text-gray-300 font-medium leading-relaxed mb-6 border-l-4 border-[#00C2FF] pl-4">
                                   {selectedArticle.summary}
                               </p>
                               <div 
                                  className="text-gray-300 space-y-4 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: articleContent }}
                               />
                           </div>
                       )}
                       
                       <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center">
                           <button className="flex items-center text-gray-400 hover:text-white transition-colors text-sm">
                               <Globe className="w-4 h-4 mr-2" /> Visit Source Website
                           </button>
                           <div className="flex space-x-2">
                               <button 
                                  onClick={() => handleSaveArticle(selectedArticle)}
                                  className="px-4 py-2 bg-[#1E2330] rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center"
                               >
                                  <Bookmark className="w-4 h-4 mr-2" /> Save for Later
                               </button>
                               <button 
                                  onClick={() => handleShareArticle(selectedArticle)}
                                  className="px-4 py-2 bg-[#00C2FF] rounded-lg text-sm text-black font-bold hover:bg-[#00A0D6] transition-colors flex items-center"
                               >
                                  <Share2 className="w-4 h-4 mr-2" /> Share
                               </button>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#1c1c1e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10">
                   <div className="p-6 border-b border-white/5 flex justify-between items-center">
                       <h2 className="text-2xl font-bold text-[#00C2FF]">Create New Alert</h2>
                       <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                   </div>
                   
                   <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                       {/* Simplified modal content */}
                       <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-300">Location</label>
                           <div className="relative">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                               <input 
                                 type="text" 
                                 value={alertLocation}
                                 onChange={e => setAlertLocation(e.target.value)}
                                 className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00C2FF]"
                               />
                           </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <select value={alertMetric} onChange={e => setAlertMetric(e.target.value)} className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-3 pl-4 pr-8 text-white appearance-none">
                                    <option>Temperature</option><option>Wind Speed</option>
                                </select>
                            </div>
                            <div className="relative">
                                <input type="number" value={alertValue} onChange={e => setAlertValue(e.target.value)} className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-3 px-4 text-white" />
                            </div>
                       </div>
                   </div>

                   <div className="p-6 border-t border-white/5 bg-[#0B0E14] flex justify-end">
                       <button onClick={() => { setShowCreateModal(false); showToast("Alert created!"); }} className="px-8 py-3 bg-[#00C2FF] text-black font-bold rounded-lg">Save Alert</button>
                   </div>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#0B0E14] border-r border-white/5 flex flex-col shrink-0">
         <div className="p-6 border-b border-white/5 mb-2 cursor-pointer" onClick={() => onNavigate('profile')}>
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] mr-3 flex items-center justify-center overflow-hidden">
                     <User className="w-8 h-8 text-gray-600 translate-y-1" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-gray-500 truncate">Lead Meteorologist</p>
                </div>
            </div>
         </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
           <button onClick={() => onNavigate('landing')} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-4 border border-white/5">
              <ArrowLeft className="w-5 h-5 mr-3" /> Back to Home
            </button>
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={item.action} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.id === activeTab ? 'bg-[#003344] text-[#00C2FF] border border-[#00C2FF]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className={`w-5 h-5 mr-3 ${item.id === activeTab ? 'text-[#00C2FF]' : 'text-gray-500'}`} /> {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#050505] p-8 custom-scrollbar">
         {activeTab === 'updates' && renderUpdatesView()}
         {activeTab === 'monitor' && renderMonitorView()}
         {activeTab === 'analytics' && renderAnalyticsView()}
         {activeTab === 'reports' && renderReportsView()}
      </main>
    </div>
  );
};
