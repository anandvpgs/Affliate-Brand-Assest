
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, BrandAnalysis, ImageConcept, AnalysisResponse } from './types';
import { analyzeWebsite, generateImage } from './services/gemini';
import { 
  Globe, 
  Target, 
  Zap, 
  Search, 
  RefreshCcw, 
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Bookmark,
  X,
  Plus,
  ArrowLeft,
  Copy,
  Layout,
  Trash2,
  Hash,
  Send,
  ShieldCheck,
  FileText,
  BookOpen,
  Info,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const PLATFORMS: Platform[] = [
  'Instagram', 'Facebook Ads', 'Google Ads', 'LinkedIn', 'Pinterest', 'YouTube', 'Website'
];

type View = 'create' | 'library' | 'privacy' | 'terms' | 'docs';

interface SavedResult {
  id: string;
  timestamp: number;
  url: string;
  data: AnalysisResponse;
  images: Record<string, string>;
}

export default function App() {
  const [view, setView] = useState<View>('create');
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('Affiliate Sales');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Instagram', 'Facebook Ads']);
  
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [currentResult, setCurrentResult] = useState<AnalysisResponse | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [library, setLibrary] = useState<SavedResult[]>([]);
  
  const [selectedConcept, setSelectedConcept] = useState<ImageConcept | null>(null);
  
  // Keyword editing state
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Synchronize keywords when result changes
  useEffect(() => {
    if (currentResult?.analysis.keywords) {
      setEditedKeywords(currentResult.analysis.keywords);
    }
  }, [currentResult]);

  // Handle copy feedback
  useEffect(() => {
    if (copyFeedback) {
      const timer = setTimeout(() => setCopyFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedback]);

  // Load library
  useEffect(() => {
    const stored = localStorage.getItem('brandvision_library');
    if (stored) {
      try {
        setLibrary(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, []);

  // Utility to handle image downloads
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logic to load a saved result from archive
  const handleLoadSaved = (item: SavedResult) => {
    setCurrentResult(item.data);
    setGeneratedImages(item.images);
    setActiveId(item.id);
    setUrl(item.url);
    setView('create');
  };

  // Logic to remove an item from the archive
  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this research?')) {
      const updated = library.filter(item => item.id !== id);
      setLibrary(updated);
      persistToDisk(updated);
    }
  };

  const persistToDisk = useCallback((items: SavedResult[]) => {
    try {
      localStorage.setItem('brandvision_library', JSON.stringify(items));
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        const pruned = [...items];
        for (let i = pruned.length - 1; i >= 0; i--) {
          if (Object.keys(pruned[i].images).length > 0) {
            pruned[i] = { ...pruned[i], images: {} };
            try {
              localStorage.setItem('brandvision_library', JSON.stringify(pruned));
              setLibrary(pruned);
              return true;
            } catch (innerE) {
              continue;
            }
          }
        }
        if (pruned.length > 1) {
          pruned.pop();
          return persistToDisk(pruned);
        }
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (activeId && currentResult) {
      const existingIndex = library.findIndex(item => item.id === activeId);
      if (existingIndex !== -1) {
        const updatedLibrary = [...library];
        const updatedItem = {
          ...updatedLibrary[existingIndex],
          data: currentResult,
          images: generatedImages,
          timestamp: Date.now()
        };
        updatedLibrary.splice(existingIndex, 1);
        const finalLibrary = [updatedItem, ...updatedLibrary].slice(0, 20);
        const stringified = JSON.stringify(finalLibrary);
        if (localStorage.getItem('brandvision_library') !== stringified) {
          persistToDisk(finalLibrary);
          setLibrary(finalLibrary);
        }
      }
    }
  }, [currentResult, generatedImages, activeId, library, persistToDisk]);

  const addToLibrary = (res: AnalysisResponse, imgs: Record<string, string>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newItem: SavedResult = {
      id,
      timestamp: Date.now(),
      url: url,
      data: res,
      images: imgs
    };
    setActiveId(id);
    const updated = [newItem, ...library].slice(0, 20);
    setLibrary(updated);
    persistToDisk(updated);
  };

  const handleTogglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const updateCurrentResultKeywords = (updated: string[]) => {
    if (currentResult) {
      setCurrentResult({
        ...currentResult,
        analysis: { ...currentResult.analysis, keywords: updated }
      });
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const kw = newKeyword.trim().replace(/^#/, '');
    if (!editedKeywords.includes(kw)) {
      const updated = [...editedKeywords, kw];
      setEditedKeywords(updated);
      updateCurrentResultKeywords(updated);
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    const updated = editedKeywords.filter(k => k !== kw);
    setEditedKeywords(updated);
    updateCurrentResultKeywords(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError(null);
    setCurrentResult(null);
    setActiveId(null);
    setGeneratedImages({});
    try {
      setLoadingStage('Analyzing brand DNA...');
      const result = await analyzeWebsite(url, goal, selectedPlatforms);
      setCurrentResult(result);
      setLoadingStage('Generating platform visuals...');
      const imgs: Record<string, string> = {};
      addToLibrary(result, {});
      for (const concept of result.concepts) {
        setLoadingStage(`Creating for ${concept.platform}...`);
        try {
          const imgUrl = await generateImage(concept);
          imgs[concept.id] = imgUrl;
          setGeneratedImages(prev => ({ ...prev, [concept.id]: imgUrl }));
        } catch (err) {
          console.error(`Failed generation`, err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
  };

  const startNewAnalysis = () => {
    setView('create');
    setCurrentResult(null);
    setActiveId(null);
    setGeneratedImages({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={startNewAnalysis}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                BrandVision AI
              </h1>
              <p className="text-[10px] text-slate-500 font-black tracking-[0.2em]">PLATFORM ENGINE</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4">
            <button 
              onClick={() => setView('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Plus size={14} /> <span className="hidden sm:inline uppercase tracking-widest">Generator</span>
            </button>
            <button 
              onClick={() => setView('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'library' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Bookmark size={14} /> <span className="hidden sm:inline uppercase tracking-widest">Archive</span>
            </button>
            <button 
              onClick={() => setView('docs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'docs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen size={14} /> <span className="hidden sm:inline uppercase tracking-widest">Guide</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* View Switcher */}
        {view === 'create' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!currentResult && !loading && (
              <section className="glass-card rounded-[2.5rem] p-8 md:p-16 border border-white/5 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black tracking-widest uppercase mb-4">
                    <Sparkles size={14} /> Next-Gen Affiliate Suite
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                    Turn any URL into <br/>
                    <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Creative Gold</span>
                  </h2>
                  <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                    Analyze identity, extract high-conversion SEO keywords, and generate platform-optimized visuals in a single click.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-12 space-y-8 text-left bg-slate-900/40 p-1 rounded-[2rem] border border-white/5 shadow-2xl">
                    <div className="bg-slate-900/60 rounded-[1.8rem] p-8 space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Analyze Target</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <Globe className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                          </div>
                          <input
                            type="url"
                            required
                            placeholder="Enter brand or product URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/30 rounded-2xl py-6 pl-16 pr-6 text-white text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Primary Goal</label>
                          <select
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/30 rounded-2xl py-5 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>Affiliate Sales</option>
                            <option>Brand Awareness</option>
                            <option>Lead Generation</option>
                            <option>App Installs</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Output Channels</label>
                          <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handleTogglePlatform(p)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black border transition-all uppercase tracking-widest ${
                                  selectedPlatforms.includes(p) 
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                  : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={loading || !url || selectedPlatforms.length === 0}
                        className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] text-xl uppercase tracking-widest"
                      >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="fill-current" />}
                        <span>Engineers Creative Assets</span>
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                  <div className="w-40 h-40 border-4 border-indigo-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-indigo-400 animate-pulse" size={54} />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <p className="text-3xl font-black text-white tracking-tighter uppercase italic">{loadingStage}</p>
                  <p className="text-slate-500 font-bold tracking-widest text-xs uppercase opacity-75">Cross-referencing market data...</p>
                </div>
              </div>
            )}

            {currentResult && !loading && (
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Brand Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                  <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-8 sticky top-28">
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <Target className="text-indigo-400" size={24} />
                        <h3 className="font-black text-xl text-white uppercase tracking-tight">Intelligence</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20 uppercase tracking-widest">
                           Synced
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <InsightItem label="Value Proposition" value={currentResult.analysis.valueProposition} icon={<Sparkles size={14}/>}/>
                      <InsightItem label="Market Position" value={currentResult.analysis.marketPosition} icon={<TrendingUp size={14}/>}/>
                      <InsightItem label="Audience Profile" value={currentResult.analysis.audience} icon={<Target size={14}/>}/>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SEO Keywords</p>
                        <button onClick={() => handleCopy(editedKeywords.join(', '), 'Keywords')} className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors">
                          {copyFeedback === 'Keywords' ? 'COPIED!' : 'COPY ALL'}
                        </button>
                      </div>
                      
                      <form onSubmit={handleAddKeyword} className="relative">
                        <input
                          type="text"
                          placeholder="Add focus term..."
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                        />
                        <button type="submit" className="absolute right-3 top-2.5 text-slate-600 hover:text-indigo-400 transition-colors">
                          <Plus size={16} />
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {editedKeywords.map((k, i) => (
                          <span key={i} className="group relative text-[10px] bg-slate-800/50 text-slate-400 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 hover:border-indigo-500/30 transition-all">
                            <Hash size={10} className="text-slate-600" />
                            {k}
                            <button onClick={() => handleRemoveKeyword(k)} className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"><X size={10}/></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Core Benefits</p>
                      <div className="space-y-3">
                        {currentResult.analysis.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-slate-400 leading-tight">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                            <span className="font-medium">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Content Area */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-1">
                      <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Creative Engine</h3>
                      <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Original assets ready for distribution</p>
                    </div>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black px-6 py-4 rounded-xl border border-white/5 transition-all flex items-center gap-2 uppercase tracking-widest">
                      <Download size={16} /> Download All Bundle
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    {currentResult.concepts.map((concept) => (
                      <CreativeCard 
                        key={concept.id} 
                        concept={concept} 
                        imageUrl={generatedImages[concept.id]} 
                        onDownload={(url) => downloadImage(url, `${concept.platform}-creative.png`)}
                        onViewDetails={() => setSelectedConcept(concept)}
                      />
                    ))}
                  </div>

                  {/* Hooks Grid */}
                  <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <Sparkles className="text-indigo-400" size={24} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">Performance Hooks</h4>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Copywriting triggers for high engagement</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {currentResult.analysis.hooks.map((hook, i) => (
                        <div key={i} className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-4 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                          <div className="flex items-center justify-between relative z-10">
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-1 rounded">
                               {i % 3 === 0 ? 'Urgency' : i % 3 === 1 ? 'Benefit' : 'Social Proof'}
                             </span>
                             <button onClick={() => handleCopy(hook, `Hook #${i+1}`)} className="text-slate-600 hover:text-white transition-colors">
                               <Copy size={14} />
                             </button>
                          </div>
                          <p className="text-slate-200 font-bold text-lg leading-snug relative z-10">"{hook}"</p>
                          <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-500">
                            <Sparkles size={80} />
                          </div>
                          {copyFeedback === `Hook #${i+1}` && (
                            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
                              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Hook Copied</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'library' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Asset Archive</h2>
                <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Your complete brand history</p>
              </div>
              <button onClick={() => { if(confirm('Wipe history?')) {localStorage.removeItem('brandvision_library'); setLibrary([]);} }} className="flex items-center gap-2 text-[10px] font-black text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all uppercase tracking-widest border border-red-400/20">
                <Trash2 size={14} /> Clear Archive
              </button>
            </div>
            {library.length === 0 ? (
              <EmptyState title="No saved research" desc="Your historical projects will appear here once generated." icon={<Bookmark size={48}/>} onAction={() => setView('create')}/>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {library.map((item) => (
                  <div key={item.id} onClick={() => handleLoadSaved(item)} className="glass-card rounded-[2rem] p-8 border border-white/5 hover:border-indigo-500/40 transition-all group cursor-pointer relative">
                    <button onClick={(e) => deleteItem(e, item.id)} className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-8 border border-indigo-400/10">
                      <Zap size={24} />
                    </div>
                    <h4 className="text-2xl font-black text-white mb-2 tracking-tight uppercase italic">{item.data.analysis.name || 'Untitled Brand'}</h4>
                    <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{item.data.analysis.valueProposition}</p>
                    <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg">{Object.keys(item.images).length} Visuals</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'docs' && <DocsView setView={setView}/>}
        {view === 'privacy' && <StaticPageView title="Privacy Protocol" icon={<ShieldCheck size={48}/>} content={<PrivacyContent/>} setView={setView}/>}
        {view === 'terms' && <StaticPageView title="Service Terms" icon={<FileText size={48}/>} content={<TermsContent/>} setView={setView}/>}
      </main>

      {/* Modal Detail */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setSelectedConcept(null)}></div>
          <div className="glass-card w-full max-w-4xl rounded-[3rem] border border-white/10 overflow-hidden relative shadow-[0_0_100px_rgba(79,70,229,0.2)] animate-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh]">
            <button onClick={() => setSelectedConcept(null)} className="absolute top-8 right-8 z-10 p-3 bg-slate-900 hover:bg-slate-800 rounded-full text-white transition-all border border-white/10 hover:rotate-90">
              <X size={24} />
            </button>
            <div className="md:w-1/2 bg-slate-900/50 flex items-center justify-center p-12 border-b md:border-b-0 md:border-r border-white/10">
              {generatedImages[selectedConcept.id] ? (
                <img src={generatedImages[selectedConcept.id]} className="w-full h-auto rounded-[2rem] shadow-2xl border border-white/5" alt="Preview"/>
              ) : (
                <div className="flex flex-col items-center gap-4">
                   <Loader2 className="animate-spin text-indigo-500" size={64}/>
                   <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Synthesizing Asset...</p>
                </div>
              )}
            </div>
            <div className="md:w-1/2 p-12 overflow-y-auto space-y-10">
               <div className="space-y-3">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-400/10 px-3 py-1.5 rounded-full inline-block">{selectedConcept.platform} Optimized</span>
                 <h3 className="text-4xl font-black text-white leading-none tracking-tighter uppercase italic">{selectedConcept.headline}</h3>
               </div>
               <div className="space-y-8">
                 <InsightItem label="Advertising Copy" value={selectedConcept.supportingText} icon={<Sparkles size={14}/>}/>
                 <InsightItem label="Visual Strategy" value={selectedConcept.visualPrompt} icon={<Info size={14}/>}/>
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversion Point</p>
                    <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-black px-6 py-3 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                      <Zap size={14} className="fill-current"/> {selectedConcept.cta}
                    </div>
                 </div>
               </div>
               {generatedImages[selectedConcept.id] && (
                 <button onClick={() => downloadImage(generatedImages[selectedConcept.id], `${selectedConcept.platform}-final.png`)} className="w-full bg-white text-slate-950 font-black py-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all uppercase tracking-widest shadow-2xl">
                   <Download size={20} /> Export PNG Asset
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-2" onClick={startNewAnalysis}>
              <Zap size={28} className="text-indigo-500" />
              <span className="font-black text-2xl tracking-tighter uppercase italic">BrandVision</span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              Autonomous brand intelligence for modern marketers. Build, analyze, and deploy high-conversion visuals in seconds.
            </p>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Resources</h5>
            <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <li><button onClick={() => setView('docs')} className="hover:text-white transition-colors">Documentation</button></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-white transition-colors">Privacy Protocol</button></li>
              <li><button onClick={() => setView('terms')} className="hover:text-white transition-colors">Terms of Use</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Status</h5>
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl w-fit">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">API Operational</span>
            </div>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">v2.4.0 Engine</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const InsightItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="text-indigo-400">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-sm text-slate-200 leading-relaxed font-bold">{value}</p>
  </div>
);

const EmptyState: React.FC<{ title: string; desc: string; icon: React.ReactNode; onAction: () => void }> = ({ title, desc, icon, onAction }) => (
  <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 glass-card rounded-[3rem] border border-white/5 border-dashed border-2">
    <div className="p-10 bg-slate-900 rounded-[2rem] text-slate-700 animate-pulse">{icon}</div>
    <div className="space-y-2">
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{title}</h3>
      <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">{desc}</p>
    </div>
    <button onClick={onAction} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-xs">Launch Generator</button>
  </div>
);

const StaticPageView: React.FC<{ title: string; icon: React.ReactNode; content: React.ReactNode; setView: (v: View) => void }> = ({ title, icon, content, setView }) => (
  <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-indigo-400 border border-white/5">{icon}</div>
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{title}</h2>
      </div>
      <button onClick={() => setView('create')} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full border border-white/5 transition-all"><X size={24}/></button>
    </div>
    <div className="glass-card rounded-[3rem] p-12 border border-white/5 text-slate-400 leading-relaxed space-y-10 prose prose-invert max-w-none">
      {content}
    </div>
  </div>
);

const PrivacyContent = () => (
  <>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">1. Local Storage First</h3>
      <p>BrandVision AI is built with privacy-first principles. Your brand research, analysis data, and generated images are stored <strong>locally on your device</strong> using browser LocalStorage. We do not maintain a backend database for your specific projects.</p>
    </div>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">2. API Communication</h3>
      <p>When you trigger an analysis, the target URL and campaign parameters are sent to Google's Gemini API via a secure, encrypted connection. This data is used solely to generate the marketing insights and visual concepts you requested.</p>
    </div>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">3. Zero Cookies</h3>
      <p>We do not use tracking cookies, analytics pixels, or third-party marketing scripts. Your interaction with the tool remains private between your browser and the underlying AI models.</p>
    </div>
  </>
);

const TermsContent = () => (
  <>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">1. Responsible Use</h3>
      <p>Users are expected to use BrandVision AI for ethical marketing research. You agree not to use the tool to analyze websites for the purpose of harassment, defamation, or illegal activities.</p>
    </div>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">2. AI Generated Content</h3>
      <p>The insights and visuals provided are generated by Large Language Models. While highly sophisticated, they may occasionally produce inaccurate or unexpected results. Users should verify critical business data independently.</p>
    </div>
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-white uppercase italic">3. Creative Ownership</h3>
      <p>Images generated via the AI engine are intended for inspirational marketing use. Users are responsible for ensuring their final campaigns comply with local advertising standards and copyright laws.</p>
    </div>
  </>
);

const DocsView = ({ setView }: { setView: (v: View) => void }) => (
  <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-indigo-400 border border-white/5"><BookOpen size={32}/></div>
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">Quick Start</h2>
      </div>
      <button onClick={() => setView('create')} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full border border-white/5 transition-all"><X size={24}/></button>
    </div>
    <div className="grid md:grid-cols-2 gap-8">
      <DocCard title="1. Brand Extraction" desc="Simply enter a product or landing page URL. Our AI crawls the site to understand tone, identity, and target audience automatically." icon={<Globe size={24}/>}/>
      <DocCard title="2. Market Insight" desc="The engine converts raw site data into value propositions and competitive advantages, giving you a 360-degree view of the brand DNA." icon={<Target size={24}/>}/>
      <DocCard title="3. Creative Engine" desc="Select your target ad platforms. The AI generates bespoke visual concepts and copywriting hooks optimized for those specific channels." icon={<Sparkles size={24}/>}/>
      <DocCard title="4. Asset Management" desc="All your research is saved in the local 'Archive'. You can revisit, re-edit, and re-download assets anytime without re-analyzing." icon={<Bookmark size={24}/>}/>
    </div>
    <div className="glass-card rounded-[3rem] p-12 border border-white/5 space-y-8">
      <h3 className="text-2xl font-black text-white uppercase italic">Platform Specifications</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <PlatformSpec name="Instagram" specs="1:1 Posts / 9:16 Stories"/>
        <PlatformSpec name="Facebook" specs="1200x628 / 1:1 Feeds"/>
        <PlatformSpec name="LinkedIn" specs="1200x627 Pro Images"/>
        <PlatformSpec name="Pinterest" specs="2:3 Optimized Verticals"/>
      </div>
    </div>
  </div>
);

const DocCard = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => (
  <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
    <div className="text-indigo-400">{icon}</div>
    <h4 className="text-xl font-black text-white uppercase italic tracking-tight">{title}</h4>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
);

const PlatformSpec = ({ name, specs }: { name: string; specs: string }) => (
  <div className="space-y-1">
    <p className="text-xs font-black text-white uppercase tracking-widest">{name}</p>
    <p className="text-[10px] text-slate-500 font-bold uppercase">{specs}</p>
  </div>
);

interface CreativeCardProps {
  concept: ImageConcept;
  imageUrl?: string;
  onDownload: (url: string) => void;
  onViewDetails: () => void;
}

const CreativeCard: React.FC<CreativeCardProps> = ({ concept, imageUrl, onDownload, onViewDetails }) => (
  <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col group transition-all hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.99]">
    <div className={`relative bg-slate-900/50 overflow-hidden flex items-center justify-center ${concept.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={concept.headline} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"/>
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-700 p-8 text-center">
          <Loader2 className="animate-spin text-indigo-500/30" size={32} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Synthesizing Creative...</p>
        </div>
      )}
      <div className="absolute top-6 left-6 flex gap-2">
        <span className="bg-slate-950/90 backdrop-blur text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">{concept.platform}</span>
        <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-indigo-500/50 uppercase tracking-widest">{concept.aspectRatio}</span>
      </div>
      {imageUrl && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
           <button onClick={() => onDownload(imageUrl)} className="bg-white text-slate-950 p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Download size={24} /></button>
           <button onClick={onViewDetails} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-white/10 hover:scale-110 active:scale-95 transition-all"><ExternalLink size={24} /></button>
        </div>
      )}
    </div>
    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
      <div className="space-y-3">
        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-1">{concept.headline}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-bold uppercase tracking-widest">{concept.cta}</p>
      </div>
      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          Ready for deploy
        </div>
        <button onClick={onViewDetails} className="text-[10px] font-black text-slate-500 hover:text-white transition-all flex items-center gap-2 group/btn uppercase tracking-widest">View Brief <ChevronRight size={14}/></button>
      </div>
    </div>
  </div>
);
