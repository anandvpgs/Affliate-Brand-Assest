
export type Platform = 
  | 'Instagram' 
  | 'Facebook Ads' 
  | 'Google Ads' 
  | 'LinkedIn' 
  | 'Pinterest' 
  | 'YouTube' 
  | 'Website';

export interface BrandAnalysis {
  name: string;
  identity: string;
  offerings: string[];
  audience: string;
  tone: string;
  valueProposition: string;
  benefits: string[];
  painPoints: string[];
  marketPosition: string;
  emotionalTriggers: string[];
  keywords: string[];
  hooks: string[];
}

export interface ImageConcept {
  id: string;
  platform: Platform;
  aspectRatio: string;
  headline: string;
  supportingText: string;
  cta: string;
  visualPrompt: string;
  imageUrl?: string;
}

export interface AnalysisResponse {
  analysis: BrandAnalysis;
  concepts: ImageConcept[];
  sources?: { title: string; uri: string }[];
}
