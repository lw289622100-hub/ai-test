import { GoogleGenAI, Type } from "@google/genai";
import { IngredientResult, ApprovedIngredient } from "../types";

export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ API Key 丢失");
    throw new Error("API Key 未配置");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 1. 定义你的“虚拟知识库”范围
  // 既然没有本地文件，我们就告诉 AI 去哪里找这些文件
  const mandatorySites = [
    "fda.gov", 
    "nifdc.org.cn", 
    "nhc.gov.cn", 
    "samr.gov.cn", 
    "efsa.europa.eu", 
    "ec.europa.eu"
  ].join(", ");

  // 2. 这里的 Prompt 就是 AI 的“大脑植入”
  // 我们要模拟你在 AI Studio 里的喂养过程
  const prompt = `
    角色设定：你是一个拥有 20 年经验的全球法规合规审计专家 (RA Specialist)。
    当前任务：针对原料 "${query}" 进行深度合规审计与穿透核查。

    【核心指令 - 模拟本地知识库】：
    虽然你无法直接访问本地 PDF，但你必须利用 Google Search 工具，**强制检索**以下官方数据源，获取与本地文件等同的信息：
    1. **US FDA**: 搜索 "site:fda.gov ${query} GRAS Notice" 和 "site:fda.gov ${query} NDI"。
    2. **CN NMPA/NHC**: 搜索 "site:nifdc.org.cn ${query}" (化妆品备案) 和 "site:nhc.gov.cn ${query}" (新食品原料)。
    3. **EU EFSA**: 搜索 "site:europa.eu ${query} novel food"。

    【数据提取标准 - 必须精准】：
    - **拒绝模糊**：不要只说“已批准”，必须找出具体的 **GRN No.** (如 GRN 000984)、**公告号** (如 2023年第X号) 或 **法规条目**。
    - **独立列出**：如果不同公司申报了同一个原料（例如 A 公司申请了 GRN 111，B 公司申请了 GRN 222），必须作为两条独立的 details 记录列出。
    - **来源校验**：每一条数据都必须有对应的官网链接作为证据。

    【输出格式】：
    严格返回 JSON 格式，字段要求如下：
    {
      "name": "${query}",
      "cas": "CAS号",
      "summary": "专业审计综述 (中文, 200字以内)",
      "details": [
        {
          "region": "CN/US/EU",
          "status": "Approved/Restricted",
          "regulatoryId": "具体编号 (如 GRN 123)",
          "approvalDate": "批准日期",
          "applicant": "申报单位",
          "dosageForm": "剂型",
          "limit": "用量要求",
          "notes": "备注",
          "sources": ["来源URL"]
        }
      ]
    }
  `;

  try {
    // 使用 gemini-1.5-flash：支持联网，免费额度高，最稳
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // 🔥 这里就是你的“联网外挂”
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
    return {
      name: query,
      cas: "N/A",
      summary: "⚠️ API 调用受限或网络错误。请稍后重试。",
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
      model: "gemini-3-flash-preview", // 保持一致
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
