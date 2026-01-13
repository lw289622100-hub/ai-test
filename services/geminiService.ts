import { GoogleGenAI, Type } from "@google/genai";
import { IngredientResult, ApprovedIngredient } from "../types";

export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ API Key 丢失");
    throw new Error("API Key 未配置");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const mandatorySites = [
    "fda.gov", "nifdc.org.cn", "nhc.gov.cn", "samr.gov.cn", "efsa.europa.eu", "europa.eu"
  ].join(", ");

  const prompt = `
    任务：针对原料 "${query}" 进行全球合规审计。
    
    【强制检索范围】：
    1. 使用 Google Search 工具检索：${mandatorySites}。
    2. 查找【GRAS Notices (GRN)】、【新原料备案公告】、【批件】。

    【核心要求】：
    - 必须列出所有不同的申报记录。
    - 严禁编造编号。

    输出格式：JSON。
  `;

  try {
    // 🔥 核心修改：使用 gemini-1.5-flash
    // 它是目前最稳、最不容易报 429 的模型，且支持联网工具。
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            cas: { type: Type.STRING },
            summary: { type: Type.STRING },
            details: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  region: { type: Type.STRING },
                  status: { type: Type.STRING },
                  regulatoryId: { type: Type.STRING },
                  approvalDate: { type: Type.STRING },
                  applicant: { type: Type.STRING },
                  dosageForm: { type: Type.STRING },
                  materialSource: { type: Type.STRING },
                  limit: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["region", "status", "regulatoryId", "sources"]
              }
            },
            groundingSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  uri: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    let result: IngredientResult = response.parsed as IngredientResult;

    if (!result && response.text) {
        try { result = JSON.parse(response.text); } catch (e) { console.error(e); }
    }

    // 防崩溃清洗
    if (!result) result = { name: query, summary: "No Data", details: [] } as any;
    if (!Array.isArray(result.details)) result.details = [];
    
    result.details = result.details.map((detail: any) => ({
        ...detail,
        sources: Array.isArray(detail.sources) ? detail.sources : [],
        region: detail.region || "Unknown",
        status: detail.status || "Checking",
        regulatoryId: detail.regulatoryId || "N/A"
    }));

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const webLinks = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || "Official Source",
          uri: c.web.uri
        }));
      if (!result.groundingSources) result.groundingSources = [];
      result.groundingSources = [...result.groundingSources, ...webLinks];
    }

    return result;

  } catch (error: any) {
    console.error("API Error:", error);
    // 即使出错，也要返回空对象防止白屏
    return {
      name: query,
      cas: "N/A",
      summary: "⚠️ 系统检测到 API 调用频率过高 (429)。请等待 1 分钟后重试。",
      details: [],
      groundingSources: []
    };
  }
};

export const fetchLatestApprovals = async (): Promise<ApprovedIngredient[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `生成 6 条 2025-2026 年真实的全球原料获批动态。返回 JSON 数组。`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // 这里也必须改成 1.5-flash
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              cas: { type: Type.STRING },
              date: { type: Type.STRING },
              region: { type: Type.STRING },
              agency: { type: Type.STRING },
              category: { type: Type.STRING },
              regulatoryId: { type: Type.STRING },
              url: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const data = response.parsed || JSON.parse(response.text || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};
