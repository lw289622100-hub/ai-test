import { GoogleGenerativeAI } from "@google/generative-ai";
import { IngredientResult, ApprovedIngredient } from "../types";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const getGenAI = () => {
  if (!API_KEY) {
    console.error("❌ 严重错误: VITE_GOOGLE_API_KEY 未设置！");
    throw new Error("API Key 未配置");
  }
  return new GoogleGenerativeAI(API_KEY);
};

export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  const genAI = getGenAI();
  
  // 🔥 核心升级：使用 2.0 Flash 实验版，并挂载 Google 搜索工具
  // 如果 2.0 报错，你可以改回 "gemini-1.5-pro" (不要用 3-preview，对工具支持不稳定，我非要用嘿嘿嘿)
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview", 
    tools: [{ googleSearch: {} }], // 👈 这一行是“找回灵魂”的关键！
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  // 恢复你的“严厉”要求
  const mandatorySites = [
    "fda.gov", "nifdc.org.cn", "nhc.gov.cn", "samr.gov.cn", "efsa.europa.eu"
  ].join(", ");

  const prompt = `
    角色：你是一个严谨的法规合规审计员。
    任务：针对原料 "${query}" 进行全球合规审计。
    
    【强制动作 - 联网锚点锁定】：
    1. 使用 Google Search 工具，优先检索以下官方域名：${mandatorySites}。
    2. 必须查找该原料的【GRAS Notices (GRN)】、【新原料备案公告】、【新食品原料批件】。
    3. 挖掘 PDF 原件或官方公示表格中的真实数据。

    【审计准则 - 严防幻觉】：
    - 严禁编造 GRN 编号或备案号。必须从搜索结果中提取真实 ID。
    - 如果有多个独立申报（如 GRN 123, GRN 456），必须分别列出，不可合并。
    - 每一个详情必须包含来源链接。

    【输出格式】：
    严格返回 JSON，结构如下：
    {
      "name": "${query}",
      "cas": "CAS号 (若有)",
      "summary": "基于搜索结果的审计综述 (中文)",
      "details": [
        {
          "region": "CN/US/EU",
          "status": "Approved/Restricted",
          "regulatoryId": "真实编号",
          "approvalDate": "日期",
          "applicant": "申报单位",
          "dosageForm": "剂型",
          "materialSource": "来源",
          "limit": "限量",
          "notes": "备注",
          "sources": ["来源链接1"] 
        }
      ],
      "groundingSources": [
         { "title": "标题", "uri": "链接" }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 1. 清洗 JSON 字符串
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // 🛡️ 2. 深度清洗 (保留这个防崩溃逻辑！)
    // 这是为了防止 "Cannot read properties of undefined (reading 'map')" 再次发生
    if (!Array.isArray(data.details)) data.details = [];
    
    data.details = data.details.map((item: any) => ({
        ...item,
        // 强制补全 sources，防止前端 map 报错
        sources: Array.isArray(item.sources) ? item.sources : [],
        // 补全其他字段
        region: item.region || "Global",
        status: item.status || "Checking",
        regulatoryId: item.regulatoryId || "N/A",
        approvalDate: item.approvalDate || "-",
        applicant: item.applicant || "-",
        notes: item.notes || ""
    }));

    // 3. 尝试提取 Google Search 的元数据 (Grounding Metadata)
    // 如果 AI 使用了搜索工具，这里会有很棒的官方链接
    if (result.response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
       const chunks = result.response.candidates[0].groundingMetadata.groundingChunks;
       const webSources = chunks
         .filter((c: any) => c.web?.uri)
         .map((c: any) => ({
            title: c.web.title || "Official Source",
            uri: c.web.uri
         }));
       
       // 合并 AI 生成的 sources 和工具返回的 sources
       if (!Array.isArray(data.groundingSources)) data.groundingSources = [];
       data.groundingSources = [...data.groundingSources, ...webSources];
       
       // 去重
       const uniqueSources = new Map();
       data.groundingSources.forEach((item: any) => uniqueSources.set(item.uri, item));
       data.groundingSources = Array.from(uniqueSources.values());
    }

    if (!Array.isArray(data.groundingSources)) data.groundingSources = [];

    return data as IngredientResult;

  } catch (error) {
    console.error("审计搜索失败:", error);
    return {
      name: query,
      cas: "N/A",
      summary: "⚠️ 审计搜索遭遇网络波动，请稍后重试。",
      details: [],
      groundingSources: []
    };
  }
};

export const fetchLatestApprovals = async (): Promise<ApprovedIngredient[]> => {
  try {
    const genAI = getGenAI();
    // 这里也加上搜索工具，保证动态是最新的
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      tools: [{ googleSearch: {} }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `查找 2025-2026 年最新的全球食品/化妆品原料获批动态，生成 6 条真实记录。返回 JSON 数组。`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("获取动态失败:", error);
    return [];
  }
};
