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
  
  // 使用你截图里确认存在的模型 ID
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview", 
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const mandatorySites = [
    "fda.gov", "nifdc.org.cn", "nhc.gov.cn", "samr.gov.cn", "efsa.europa.eu"
  ].join(", ");

  const prompt = `
    任务：针对原料 "${query}" 进行全球合规审计。
    强制检索范围：${mandatorySites}。
    
    输出要求：
    必须严格返回符合以下 JSON 格式（不要 Markdown 标记）：
    {
      "name": "${query}",
      "cas": "CAS号或N/A",
      "summary": "200字以内的审计综述",
      "details": [
        {
          "region": "CN",
          "status": "合规/禁用/受限",
          "regulatoryId": "备案号/公告号",
          "approvalDate": "日期",
          "applicant": "申报单位",
          "dosageForm": "剂型",
          "materialSource": "来源",
          "limit": "使用限量",
          "notes": "备注",
          "sources": ["来源1", "来源2"]
        }
      ],
      "groundingSources": []
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 1. 基础清洗
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // 🛡️ 2. 深度清洗 (Deep Sanitize) - 这是解决 map 报错的关键！
    // 确保 details 数组存在
    if (!Array.isArray(data.details)) {
        data.details = [];
    }

    // 遍历每一个 detail，确保里面的字段都齐全
    data.details = data.details.map((item: any) => ({
        ...item,
        // 如果 sources 缺失，强制给一个空数组，防止 .map() 崩溃
        sources: Array.isArray(item.sources) ? item.sources : [],
        // 其他字段也给个默认值，防止显示 undefined
        region: item.region || "Unknown",
        status: item.status || "Unknown",
        regulatoryId: item.regulatoryId || "N/A"
    }));

    // 确保 groundingSources 也是数组
    if (!Array.isArray(data.groundingSources)) {
        data.groundingSources = [];
    }

    return data as IngredientResult;

  } catch (error) {
    console.error("Gemini 调用失败:", error);
    // 兜底返回
    return {
      name: query,
      cas: "N/A",
      summary: "⚠️ 数据解析失败或网络错误，请重试。",
      details: [],
      groundingSources: []
    };
  }
};

export const fetchLatestApprovals = async (): Promise<ApprovedIngredient[]> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `生成 6 条 2025-2026 年真实的全球原料获批动态。返回 JSON 数组。`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("获取动态失败:", error);
    return [];
  }
};
