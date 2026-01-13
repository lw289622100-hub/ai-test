import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// ⚠️ 注意：如果你安装的是 "@google/genai" 新版包，写法稍有不同。
// 下面的代码是基于最通用的 "@google/generative-ai" 包编写的（兼容性最好）。
// 如果你报错找不到 SchemaType，请告诉我，我再给你调整。

import { IngredientResult, ApprovedIngredient } from "../types";

// 👇 修正 1: Vite 必须用 import.meta.env 读取变量
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// 安全检查：防止 Key 不存在时直接崩坏
const getGenAI = () => {
  if (!API_KEY) {
    console.error("❌ 严重错误: VITE_GOOGLE_API_KEY 未设置！");
    throw new Error("API Key 未配置");
  }
  return new GoogleGenerativeAI(API_KEY);
};

/**
 * 2026 深度法规审计引擎 - 精准锚点检索
 */
export const searchIngredient = async (query: string): Promise<IngredientResult> => {
  const genAI = getGenAI();
  
  // 👇 修正 2: 使用当前真实存在的模型 (推荐 gemini-1.5-flash 速度快且支持 JSON)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      // responseSchema: ... (Gemini 1.5 Flash 对 JSON Schema 支持很好，下面直接放在 prompt 里约束也可以，或者用 Schema 对象)
    }
  });

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
    1. 你必须基于你的知识库优先检索以下官方域名下的信息：${mandatorySites}。
    2. 模拟检索策略：查找该原料的【GRAS Notices (GRN)】、【新原料备案公告】、【新食品原料批件】。
    
    【审计准则 - 严防虚假编号】：
    - 严禁编造任何 GRN 编号或备案号。
    - 如果一个原料由不同公司申报了多个 GRN（例如 GRN 1051, GRN 1100 等），必须【全部独立列出】。
    - 每一条结果必须核对：[申报主体]、[批准 ID]、[批准日期]。

    【输出格式要求】：
    必须严格返回符合以下 TypeScript 接口的 JSON 格式（不要 Markdown 代码块）：
    {
      "name": "原料名称",
      "cas": "CAS号",
      "summary": "基于官方原始资料的审计研判综述",
      "details": [
        {
          "region": "CN/US/EU",
          "status": "合规状态",
          "regulatoryId": "真实编号 (如 GRN 1234)",
          "approvalDate": "批准日期",
          "applicant": "申报单位",
          "dosageForm": "适用剂型",
          "materialSource": "原料来源",
          "limit": "使用限量",
          "notes": "核对说明"
        }
      ],
      "groundingSources": [
         { "title": "参考来源标题", "uri": "链接地址" }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清洗 JSON（防止 AI 返回 ```json 开头）
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return data as IngredientResult;
  } catch (error) {
    console.error("RA Audit Precise Search Error:", error);
    // 返回一个空的兜底数据，防止前端白屏
    return {
      name: query,
      cas: "N/A",
      summary: "审计服务暂时不可用或网络连接失败，请检查 API Key。",
      details: [],
      groundingSources: []
    };
  }
};

export const fetchLatestApprovals = async (): Promise<ApprovedIngredient[]> => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    生成 6 条 2024-2025 年真实的全球原料获批动态，包含具体公告号/GRN。
    返回 JSON 数组，格式如下：
    [
      {
        "id": "unique_id",
        "name": "原料名",
        "cas": "CAS",
        "date": "日期",
        "region": "地区",
        "agency": "机构",
        "category": "类别",
        "regulatoryId": "编号",
        "url": "链接"
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as ApprovedIngredient[];
  } catch (error) {
    console.error("Fetch Approvals Error:", error);
    return [];
  }
};
