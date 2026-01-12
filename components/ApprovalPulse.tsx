
import React from 'react';
import { ApprovedIngredient } from '../types';
import { COLORS } from '../constants';

interface ApprovalPulseProps {
  approvals: ApprovedIngredient[];
}

const ApprovalPulse: React.FC<ApprovalPulseProps> = ({ approvals }) => {
  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
      {approvals.map((item) => (
        <a 
          key={item.id} 
          href={item.url || '#'} 
          target={item.url ? "_blank" : "_self"} 
          rel="noreferrer"
          className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-[#2D5A27] hover:shadow-lg transition-all duration-500 block no-underline"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shrink-0 transition-transform group-hover:scale-105 ${
            item.region === 'CN' ? 'bg-[#2D5A27]' : item.region === 'US' ? 'bg-[#0A3161]' : 'bg-[#003399]'
          }`}>
            {item.region}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-slate-800 truncate text-sm group-hover:text-[#2D5A27] transition-colors uppercase tracking-tight">{item.name}</h4>
              <span className="text-[9px] text-slate-300 font-black whitespace-nowrap ml-2 uppercase tracking-tighter">{item.date}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 font-black uppercase">{item.agency}</span>
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#2D5A27] font-black uppercase truncate max-w-[120px]">{item.regulatoryId}</span>
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[#C5A059] font-black uppercase">{item.category}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default ApprovalPulse;
