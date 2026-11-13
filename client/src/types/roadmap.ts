export type RoadmapRoleCategory = 'Functional' | 'Technical' | 'Development';

export interface RoadmapSkillItem {
  id: string;
  title: string;
  description?: string;
  isCoreMilestone?: boolean;
}

export interface RoadmapStage {
  stageNumber: number;
  stageLabel: string;
  title: string;
  subtitle: string;
  whyItMatters: string;
  whatToLearn: RoadmapSkillItem[];
  milestoneOutcome: string;
  estimatedTimeline?: string;
}

export interface SAPRoadmap {
  id: string;
  slug: string;
  title: string;
  role: string;
  category: RoadmapRoleCategory;
  subtitle: string;
  description: string;
  targetAudience: string;
  level: string;
  icon: string;
  badge?: string;
  accentColor?: 'emerald' | 'sky' | 'indigo' | 'purple' | 'amber' | 'teal';
  prerequisites: string[];
  careerOutcomes: string[];
  stages: RoadmapStage[];
}

