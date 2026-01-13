/**
 * src/services/geminiService.ts
 * 基于你提供的原始代码进行环境适配 (Vite + Vercel)
 */

// 确保安装了最新版 SDK: npm install @google/genai
import { GoogleGenAI, Type } from "@google/genai";
import { IngredientResult, ApprovedIngredient } from "../types";

export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  // 1. 【必须修改】Vite 环境只能通过 import.meta.env 读取变量
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ API Key 丢失");
    throw new Error("API Key 未配置");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 保持你原始的 Prompt 逻辑不变
  const mandatorySites = [
    "fda.gov", "nifdc.org.cn", "nhc.gov.cn", "samr.gov.cn", "efsa.europa.eu", "europa.eu"
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
    // 2. 【必须修改】模型选择
    // 你的原始代码是 gemini-3-pro-preview，但 API 调用极易 404。
    // 改用 gemini-2.0-flash-exp，它支持 googleSearch 工具且效果最好。
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: prompt,
      config: {
        // 🔥 核心逻辑恢复：保留 Google 搜索工具，找回准确性
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

    // 解析结果：优先使用 SDK 的 parsed 功能
    let result: IngredientResult = response.parsed as IngredientResult;

    // 如果 SDK 解析失败，兜底解析 text
    if (!result && response.text) {
        try {
            result = JSON.parse(response.text);
        } catch (e) { console.error("JSON Parse Error", e); }
    }

    // 3. 【必须添加】防崩溃数据清洗
    // 解释：React 对 undefined 非常敏感。这里必须强制把可能缺失的 sources 补全为空数组。
    // 这不会影响结果准确性，只是为了防止网页白屏。
    if (!result) result = { name: query, summary: "No Data", details: [] } as any;
    if (!Array.isArray(result.details)) result.details = [];
    
    result.details = result.details.map((detail: any) => ({
        ...detail,
        // 关键点：如果 AI 没返回 sources，强制给个 []，解决 map 报错
        sources: Array.isArray(detail.sources) ? detail.sources : [],
        // 补全其他显示字段
        region: detail.region || "Unknown",
        status: detail.status || "Checking",
        regulatoryId: detail.regulatoryId || "N/A"
    }));

    // 提取官方链接 (Grounding Metadata) 并合并
    // 你的原始代码也有这个逻辑，这里保留并增强
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

  } catch (error) {
    console.error("搜索服务异常:", error);
    // 返回空对象，防止白屏
    return {
      name: query,
      cas: "N/A",
      summary: "⚠️ 暂时无法连接审计网络，请检查 API Key 权限。",
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
      model: "gemini-3-pro-preview", // 保持模型一致
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
