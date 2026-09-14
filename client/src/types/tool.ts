// Type definitions for developer tools
export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription: string;
  icon: string;
  status: 'available' | 'coming-soon' | 'beta';
  priority: 'p0' | 'p1' | 'p2';
  relatedLessons: string[];
  relatedTools: string[];
  features: string[];
  seo: ToolSEO;
}

export interface ToolSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  tools: Tool[];
}
