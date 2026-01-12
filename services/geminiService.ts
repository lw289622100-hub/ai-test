
import { GoogleGenAI, Type } from "@google/genai";
import { IngredientResult, ApprovedIngredient, GroundingLink } from "../types";
import { REGULATORY_URLS } from "../constants";

/**
 * 2026 深度法规审计引擎 - 精准锚点检索 (Site-Specific Grounding)
 */
export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 注入指定的官方门户域名，强制 AI 在这些范围内检索 PDF 和公告
  const mandatorySites = [
    "fda.gov", 
    "nifdc.org.cn", 
    "nhc.gov.cn", 
    "samr.gov.cn", 
    "efsa.europa.eu", 
    "europa.eu"
  ].join(", ");

  const prompt = `
    任务：针对原料 "${query}" 进行全球合规审计。
    
    【强制检索范围 - 锚点锁定】：
    1. 你必须优先检索以下官方域名下的信息：${mandatorySites}。
    2. 检索策略：使用 "site:域名" 查找该原料的【GRAS Notices (GRN)】、【新原料备案公告】、【新食品原料批件】。
    3. 特别注意：必须寻找 PDF 文档或官方公示表格中的真实数据。

    【审计准则 - 严防虚假编号】：
    - 严禁编造任何 GRN 编号或备案号。必须从搜索到的原始网页/PDF 中提取。
    - 如果一个原料由不同公司申报了多个 GRN（例如 GRN 1051, GRN 1100 等），必须【全部独立列出】，不得合并。
    - 每一条结果必须核对：[申报主体]、[批准 ID]、[批准日期]、[工艺描述] 是否与官网公示一致。

    输出要求：
    - 全程专业中文。
    - 必须包含所有搜索到的独立记录。
    - 返回格式：JSON。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            cas: { type: Type.STRING },
            summary: { type: Type.STRING, description: "基于官方原始资料的审计研判综述" },
            details: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  region: { type: Type.STRING },
                  status: { type: Type.STRING },
                  regulatoryId: { type: Type.STRING, description: "来自官方 PDF/网页的真实编号" },
                  approvalDate: { type: Type.STRING },
                  applicant: { type: Type.STRING },
                  dosageForm: { type: Type.STRING },
                  materialSource: { type: Type.STRING },
                  limit: { type: Type.STRING },
                  notes: { type: Type.STRING, description: "包含对来源 PDF 的核对说明" },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["region", "status", "regulatoryId", "approvalDate", "applicant", "dosageForm", "materialSource", "limit", "notes", "sources"]
              }
            }
          },
          required: ["name", "summary", "details"]
        }
      }
    });

    let result: IngredientResult = JSON.parse(response.text || '{}');

    // 提取 Grounding 元数据作为“证据原件链接”
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.groundingSources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return result;
  } catch (error) {
    console.error("RA Audit Precise Search Error:", error);
    throw error;
  }
};

export const fetchLatestApprovals = async (): Promise<ApprovedIngredient[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `生成 6 条 2025-2026 年真实的全球原料获批动态，包含具体公告号/GRN。返回 JSON 数组。`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
            },
            required: ["id", "name", "date", "region", "agency", "category", "regulatoryId"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]') as ApprovedIngredient[];
  } catch (error) {
    return [];
  }
};
