
import React, { useState, useMemo } from 'react';
import { RECENT_APPROVALS, MOCK_ALERTS, REGULATORY_URLS } from './constants';
import ApprovalPulse from './components/ApprovalPulse';
import ResultCard from './components/ResultCard';
import { searchIngredient, fetchLatestApprovals } from './services/geminiService';
import { IngredientResult, AppModule, ApprovedIngredient, RegionDetail } from './types';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.DASHBOARD);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<IngredientResult | null>(null);
  const [approvals, setApprovals] = useState<ApprovedIngredient[]>(RECENT_APPROVALS);

  const groupedDetails = useMemo(() => {
    if (!result) return {};
    const groups: Record<string, RegionDetail[]> = {};
    result.details.forEach(detail => {
      if (!groups[detail.region]) groups[detail.region] = [];
      groups[detail.region].push(detail);
    });
    return groups;
  }, [result]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setResult(null);
    try {
      const data = await searchIngredient(searchQuery);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshApprovals = async () => {
    setIsRefreshing(true);
    try {
      const latest = await fetchLatestApprovals();
      if (latest && latest.length > 0) {
        setApprovals(latest);
      }
    } catch (err) {
      console.error("Failed to refresh approvals:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-12">
      <section className="grid lg:grid-cols-2 gap-8 items-start bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5A27]/5 text-[#2D5A27] text-[10px] font-black uppercase tracking-wider border border-[#2D5A27]/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Precision Portal Audit 2026
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            RA 精准溯源审计<br />
            <span className="text-[#2D5A27]">官方 PDF 原件核查</span>
          </h2>
          <p className="text-slate-500 max-w-sm leading-relaxed text-sm font-medium">
            锁定 FDA、NMPA、EFSA 官方域名及 PDF 资源，针对单一原料的【多项独立申报】进行真实性核对。
          </p>
          <div className="flex gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 text-center">
              <div className="text-2xl font-black text-[#2D5A27]">Portal</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">官方指定域名</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 text-center">
              <div className="text-2xl font-black text-[#C5A059]">100%</div>
              <div className="text-[9px] uppercase font-bold text-slate-400">结果真实性</div>
            </div>
          </div>
        </div>
        <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
              最新获批动态 (审计中)
            </h3>
            <button 
              onClick={handleRefreshApprovals}
              disabled={isRefreshing}
              className={`flex items-center gap-2 text-[10px] font-bold text-[#2D5A27] hover:bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              同步库
            </button>
          </div>
          <ApprovalPulse approvals={approvals} />
        </div>
      </section>

      <section className="max-w-4xl mx-auto space-y-10 pb-20">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入原料名开启官方库穿透核对 (如: 麦角硫因)..."
            className="w-full h-20 pl-8 pr-44 bg-white rounded-3xl shadow-xl border-2 border-transparent focus:border-[#2D5A27]/20 text-xl font-medium focus:outline-none transition-all placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-3 top-3 bottom-3 px-8 bg-[#2D5A27] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[#2D5A27]/20 transition-all disabled:opacity-50"
          >
            {isLoading ? '正在穿透库...' : '官方精准核验'}
          </button>
        </form>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#2D5A27]/10 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-[#2D5A27] font-black text-xs uppercase tracking-[0.2em] animate-pulse">正在锁定官方门户检索真实 GRN/备案 ID</p>
              <p className="text-slate-400 text-[10px] font-medium italic">审计规则：严防虚假信息，仅采用官方 PDF 与公告数据</p>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">{result.name}</h1>
                <div className="flex gap-2 mt-3">
                  <span className="bg-slate-800 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest">Grounded Result</span>
                  <span className="bg-[#C5A059] text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest">CAS: {result.cas || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2D5A27]/5 p-10 rounded-[40px] border border-[#2D5A27]/10 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h4 className="text-[11px] uppercase font-black text-[#2D5A27] mb-4 tracking-[0.2em] flex items-center gap-3">
                <span className="w-6 h-[2px] bg-[#2D5A27]"></span>
                审计研判报告 (官网原件核对版)
              </h4>
              <p className="text-slate-700 leading-relaxed text-base font-medium whitespace-pre-wrap">{result.summary}</p>
            </div>

            <div className="space-y-24">
              {Object.entries(groupedDetails).map(([region, details]) => (
                <div key={region} className="space-y-10">
                  <div className="flex items-center gap-6 px-2">
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter shrink-0">{region}</h3>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">独立记录数</span>
                      <span className="bg-[#2D5A27] text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                        {details.length}
                      </span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {details.map((detail, idx) => (
                      <ResultCard key={`${region}-${idx}`} detail={detail} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence Traceability Links */}
            {result.groundingSources && result.groundingSources.length > 0 && (
              <div className="pt-16 mt-16 border-t-2 border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 035.656 5.656l-1.101 1.101m-5.656-5.656l1.103-1.103"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase font-black text-slate-900 tracking-[0.2em]">官方审计追踪证据 (Grounded Evidence)</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Direct Audit Links from Regulatory Portals</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.groundingSources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#2D5A27] hover:shadow-xl transition-all flex items-start gap-4 group shadow-sm"
                    >
                      <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2D5A27]/10">
                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 group-hover:text-[#2D5A27] truncate">{source.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1 font-medium">{source.uri}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end border-b-2 border-slate-100 pb-8 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">审计资源库</h2>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">Official Regulatory Portal Access Points</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4 font-black text-slate-900 text-xs tracking-[0.2em] border-l-4 border-red-600 pl-4 uppercase">CN Portal Network</div>
          {[
            { title: "NMPA 化妆品新原料备案", desc: "穿透备案号与备案主体核查", url: REGULATORY_URLS.CN_NMPA_COSMETIC },
            { title: "NHC 三新食品公告", desc: "新原料/添加剂公告原件溯源", url: REGULATORY_URLS.CN_NHC_FOOD },
            { title: "SAMR 保健食品目录", desc: "备案制原料及限量标准核查", url: REGULATORY_URLS.CN_SAMR_HEALTH },
          ].map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block p-6 rounded-[28px] bg-white border border-slate-100 hover:border-[#2D5A27] hover:shadow-2xl transition-all no-underline group">
              <h4 className="text-sm font-black text-slate-800 group-hover:text-[#2D5A27] leading-tight">{item.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider leading-relaxed">{item.desc}</p>
            </a>
          ))}
        </div>
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4 font-black text-slate-900 text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4 uppercase">US FDA Portal Network</div>
          {[
            { title: "FDA GRAS (GRN) Inventory", desc: "穿透 GRN 申报公司及用途检索", url: REGULATORY_URLS.US_FDA_GRAS },
            { title: "NDI Notifications", desc: "新膳食成分受理证据链检索", url: REGULATORY_URLS.US_FDA_NDI },
          ].map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block p-6 rounded-[28px] bg-white border border-slate-100 hover:border-[#2D5A27] hover:shadow-2xl transition-all no-underline group">
              <h4 className="text-sm font-black text-slate-800 group-hover:text-[#2D5A27] leading-tight">{item.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider leading-relaxed">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 selection:bg-[#2D5A27]/10 selection:text-[#2D5A27]">
      <nav className="sticky top-0 z-[100] glass-morphism border-b border-slate-200 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentModule(AppModule.DASHBOARD)}>
            <div className="w-12 h-12 bg-[#2D5A27] rounded-[18px] flex items-center justify-center text-white font-black shadow-xl">RA</div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Compliance <span className="text-[#C5A059]">Pro</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditor Edition 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <button onClick={() => setCurrentModule(AppModule.DASHBOARD)} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentModule === AppModule.DASHBOARD ? 'text-[#2D5A27]' : 'text-slate-400 hover:text-slate-600'}`}>Audit Dashboard</button>
            <button onClick={() => setCurrentModule(AppModule.LIBRARY)} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentModule === AppModule.LIBRARY ? 'text-[#2D5A27]' : 'text-slate-400 hover:text-slate-600'}`}>Evidence Base</button>
            <button onClick={() => setCurrentModule(AppModule.ALERTS)} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentModule === AppModule.ALERTS ? 'text-[#2D5A27]' : 'text-slate-400 hover:text-slate-600'}`}>Risk Radar</button>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-black text-[#2D5A27] bg-[#2D5A27]/5 px-5 py-2.5 rounded-full border border-[#2D5A27]/10 uppercase tracking-tighter">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Grounded & Verified
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-20">
        {currentModule === AppModule.DASHBOARD && renderDashboard()}
        {currentModule === AppModule.LIBRARY && renderLibrary()}
        {currentModule === AppModule.ALERTS && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in">
             <div className="border-b-2 border-slate-100 pb-8">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight">监管核查雷达</h2>
               <p className="text-slate-400 text-[11px] font-bold uppercase mt-2 tracking-widest">Real-time Risk Intelligence & Regulatory Shifts</p>
             </div>
             <div className="grid gap-8">
               {MOCK_ALERTS.map(a => (
                 <div key={a.id} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex items-start gap-10 hover:shadow-2xl hover:border-[#2D5A27]/20 transition-all group">
                   <div className={`mt-2 w-4 h-4 rounded-full shrink-0 ${a.severity === 'high' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-amber-500'}`}></div>
                   <div className="flex-1">
                     <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{a.date} · {a.region}</span>
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${a.severity === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{a.type}</span>
                     </div>
                     <h4 className="font-black text-slate-800 text-2xl leading-tight group-hover:text-[#2D5A27] transition-colors">{a.title}</h4>
                     <p className="mt-6 text-xs text-slate-500 leading-relaxed font-medium italic border-l-4 border-slate-100 pl-6">审计提醒：此政策变动可能涉及 2025 年以前的所有历史申报批次，请根据审计流水号逐一穿透核对。</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>

      <footer className="mt-60 py-24 border-t-2 border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h5 className="font-black text-slate-900 mb-4 uppercase tracking-[0.3em] text-sm">RA Compliance Pro Precision Auditor</h5>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.5em] leading-loose max-w-2xl mx-auto">
              锁定官方库检索 · 精准 PDF 证据穿透 · 数据一致性核验系统<br/>
              © 2026 Regulatory Affairs Professional Intelligence.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
