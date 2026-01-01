
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BrandAnalysis, ImageConcept, Platform, AnalysisResponse } from "../types";

export const analyzeWebsite = async (
  url: string, 
  goal: string, 
  platforms: Platform[]
): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  
  const systemPrompt = `
    You are an advanced AI research and creative assistant designed to help with affiliate marketing and brand analysis.
    Your task is to analyze the provided URL and perform:
    1. Website Research: Extract brand identity, core offerings, target audience, tone, and value proposition.
    2. Brand Insights: Summarize market positioning, ideal customer profile, and competitive advantage. 
    3. SEO Keyword Analysis: Generate a comprehensive list of high-traffic, relevant SEO keywords and long-tail phrases that align with the brand's offerings.
    4. Visual Concepts: Design original, high-conversion visual concepts for affiliate marketing. 
       - Must not copy brand visuals or logos.
       - Highlight benefits and emotional triggers.
       - Optimized for the target platform's aspect ratios.
  `;

  const prompt = `
    Website: ${url}
    Primary Goal: ${goal}
    Target Platforms: ${platforms.join(', ')}

    Return a JSON response matching the schema. Focus on SEO-optimized keywords, emotional triggers, and pain points solved.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              identity: { type: Type.STRING },
              offerings: { type: Type.ARRAY, items: { type: Type.STRING } },
              audience: { type: Type.STRING },
              tone: { type: Type.STRING },
              valueProposition: { type: Type.STRING },
              benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              marketPosition: { type: Type.STRING },
              emotionalTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of high-value SEO keywords" },
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "identity", "offerings", "audience", "tone", "valueProposition", "benefits", "painPoints", "marketPosition", "emotionalTriggers", "keywords", "hooks"]
          },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                platform: { type: Type.STRING },
                aspectRatio: { type: Type.STRING, description: "Aspect ratio like 1:1, 9:16, or 16:9" },
                headline: { type: Type.STRING },
                supportingText: { type: Type.STRING },
                cta: { type: Type.STRING },
                visualPrompt: { type: Type.STRING, description: "Detailed AI image generation prompt for an original scene (no text/logos)" }
              },
              required: ["id", "platform", "aspectRatio", "headline", "supportingText", "cta", "visualPrompt"]
            }
          }
        },
        required: ["analysis", "concepts"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'External Source',
    uri: chunk.web?.uri || '#'
  })).filter((s: any) => s.uri !== '#');

  return { 
    analysis: data.analysis, 
    concepts: data.concepts, 
    sources 
  };
};

export const generateImage = async (concept: ImageConcept): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';
  
  const ratioMap: Record<string, "1:1" | "3:4" | "4:3" | "9:16" | "16:9"> = {
    "1:1": "1:1",
    "4:5": "3:4",
    "9:16": "9:16",
    "16:9": "16:9",
    "3:4": "3:4",
    "4:3": "4:3"
  };

  const selectedRatio = ratioMap[concept.aspectRatio] || "1:1";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: `High-conversion marketing photography/digital art for ${concept.platform}. Focus: ${concept.visualPrompt}. NO TEXT, NO LOGOS. Clean, professional lighting, modern aesthetic.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: selectedRatio
      }
    }
  });

  let imageUrl = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("No image generated");
  return imageUrl;
};
