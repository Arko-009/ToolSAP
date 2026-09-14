// Type definitions for learning content
export interface LearningCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  lessonCount: number;
  status: 'available' | 'coming-soon';
  order: number;
}

export interface LearningDomain {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  categories: LearningCategory[];
  status: 'available' | 'coming-soon';
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  domainSlug: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  status: 'available' | 'coming-soon';
  objectives: string[];
  relatedTools: string[];
  relatedLessons: string[];
  seo: SEOMetadata;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  steps: LearningPathStep[];
}

export interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
}
