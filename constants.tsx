
import { ApprovedIngredient, Alert } from './types';

export const COLORS = {
  primary: '#2D5A27', 
  secondary: '#F8FAFC', 
  accent: '#C5A059', 
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const REGULATORY_URLS = {
  CN_NMPA_COSMETIC: "https://hzpsys.nifdc.org.cn/hzpGS/ysyhzpylml#",
  CN_NHC_FOOD: "http://www.nhc.gov.cn/sps/s7891/202310/7c4f1c9c0f914b188c6e2646d5f782c5.shtml",
  CN_SAMR_HEALTH: "https://www.samr.gov.cn/fgs/index.html",
  US_FDA_GRAS: "https://www.cfsanappsexternal.fda.gov/scripts/fdcc/?set=GRASNotices",
  US_FDA_NDI: "https://www.fda.gov/food/new-dietary-ingredient-ndi-notification-process",
  EU_NOVEL_FOOD: "https://ec.europa.eu/food/food-feed-portal/screen/novel-food-catalogue/search",
  EU_EFSA_OPINIONS: "https://www.efsa.europa.eu/en/publications",
};

export const RECENT_APPROVALS: ApprovedIngredient[] = [
  { 
    id: 'ap_2026_01_10', 
    name: '重组人源化胶原蛋白', 
    cas: 'N/A', 
    date: '2026-01-10', 
    region: 'CN', 
    agency: 'NMPA', 
    category: '化妆品新原料',
    // Fix: Added required regulatoryId
    regulatoryId: '国妆原备字20260002',
    url: REGULATORY_URLS.CN_NMPA_COSMETIC
  },
  { 
    id: 'ap_2025_12_15', 
    name: '2\'-岩藻糖基乳糖 (2\'-FL)', 
    cas: '41263-94-9', 
    date: '2025-12-15', 
    region: 'CN', 
    agency: 'NHC', 
    category: '营养强化剂',
    // Fix: Added required regulatoryId
    regulatoryId: '公告 2025-12 批次',
    url: REGULATORY_URLS.CN_NHC_FOOD
  },
  { 
    id: 'ap_2025_07_15', 
    name: 'D-阿洛酮糖 (Psicose)', 
    cas: '551-68-8', 
    date: '2025-07-15', 
    region: 'CN', 
    agency: 'NHC', 
    category: '新食品原料',
    // Fix: Added required regulatoryId
    regulatoryId: '2025年第4号公告',
    url: REGULATORY_URLS.CN_NHC_FOOD
  },
  { 
    id: 'ap_2025_11_20', 
    name: '麦角硫因 (L-Ergothioneine)', 
    cas: '497-30-3', 
    date: '2025-11-20', 
    region: 'US', 
    agency: 'FDA', 
    category: 'GRAS',
    // Fix: Added required regulatoryId
    regulatoryId: 'Blue California GRN 1051',
    url: REGULATORY_URLS.US_FDA_GRAS
  },
  { 
    id: 'ap_2025_09_10', 
    name: 'Monomethylsilanetriol', 
    cas: '2445-53-6', 
    date: '2025-09-10', 
    region: 'EU', 
    agency: 'EFSA', 
    category: 'Novel Food',
    // Fix: Added required regulatoryId
    regulatoryId: '(EU) 2017/2470',
    url: REGULATORY_URLS.EU_NOVEL_FOOD
  },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'al_01', date: '2026-01-11', region: '中国', type: '合规排查', title: '卫健委重申：麦角硫因尚未获批用于食品，严查口服产品', severity: 'high' },
  { id: 'al_02', date: '2026-01-08', region: '美国', type: 'FDA', title: 'FDA 对 GRAS 条例下“合成生物”路径原料审核趋严', severity: 'medium' },
];
