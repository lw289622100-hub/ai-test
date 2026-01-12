
import React from 'react';
import { RegionDetail, ComplianceStatus } from '../types';

interface ResultCardProps {
  detail: RegionDetail;
}

const ResultCard: React.FC<ResultCardProps> = ({ detail }) => {
  const getBadgeColor = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.PASSED: return 'bg-emerald-600 text-white';
      case ComplianceStatus.RESTRICTED: return 'bg-amber-500 text-white';
      case ComplianceStatus.PROHIBITED: return 'bg-rose-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col h-full border-b-4 border-b-[#2D5A27]/20">
      {/* Region & Header */}
      <div className={`p-4 flex justify-between items-center ${getBadgeColor(detail.status)}`}>
        <div className="flex items-center gap-2">
          <span className="font-black text-xs uppercase tracking-[0.1em]">{detail.region}</span>
          <span className="w-1 h-1 bg-white/40 rounded-full"></span>
          <span className="font-bold text-[10px] opacity-90">{detail.approvalDate}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter backdrop-blur-sm border border-white/10">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          官方库核验
        </div>
      </div>
      
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* Core Evidence Identity */}
        <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-[#2D5A27]/5 group-hover:border-[#2D5A27]/20 transition-colors">
          <label className="block text-[8px] font-black text-[#2D5A27]/60 uppercase tracking-widest mb-1.5">锚点证据编号 / Regulatory ID</label>
          <div className="flex items-baseline gap-2">
            <p className="text-[#2D5A27] font-black text-lg leading-tight tracking-tight">{detail.regulatoryId}</p>
            <div className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">PDF</div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-2 gap-4 text-[11px]">
          <div className="col-span-2">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">申报主体 (Applicant)</label>
            <p className="text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate">
              {detail.applicant}
            </p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">来源/工艺</label>
            <p className="text-slate-700 font-medium leading-tight">{detail.materialSource}</p>
          </div>
          
          <div className="space-y-1 pl-4 border-l border-slate-100">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">限量标准</label>
            <p className="text-slate-700 font-medium leading-tight">{detail.limit}</p>
          </div>

          <div className="col-span-2 pt-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">获批用途</label>
            <p className="text-slate-500 font-medium leading-relaxed italic line-clamp-2">
              {detail.dosageForm}
            </p>
          </div>
        </div>

        {/* Audit Notes with Authenticity Badge */}
        <div className="pt-4 border-t border-slate-100 flex-1">
           <div className="flex justify-between items-center mb-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">审计比对意见</label>
             <span className="text-[8px] font-black text-[#C5A059] uppercase">Grounded Audit</span>
           </div>
           <p className="text-[10px] text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
             {detail.notes}
           </p>
        </div>

        {/* Direct Source Links */}
        <div className="pt-4 mt-auto">
          <div className="flex flex-wrap gap-2">
            {detail.sources.map((source, i) => (
              <a 
                key={i} 
                href={source} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[8px] font-black text-[#2D5A27] uppercase tracking-wider bg-[#2D5A27]/5 px-3 py-1.5 rounded-lg border border-[#2D5A27]/10 hover:bg-[#2D5A27] hover:text-white transition-all shadow-sm"
              >
                查看官网公告原文
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
