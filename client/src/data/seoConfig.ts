import { tools } from './tools.ts';

export interface RouteSeoData {
  path: string;
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  ogType?: string;
  structuredDataType?: 'WebSite' | 'WebApplication' | 'Article';
}

export const SITE_NAME = 'ToolSAP';
export const BASE_URL = 'https://tool-sap.vercel.app';

export const STATIC_PAGE_SEO: Record<string, RouteSeoData> = {
  '/': {
    path: '/',
    title: 'ToolSAP — SAP Tools & Learning',
    description: 'Explore free SAP developer tools and practical SAP learning resources to build skills and solve problems faster.',
    canonical: '/',
    keywords: [
      'ToolSAP',
      'toolsap',
      'tool sap',
      'SAP developer tools',
      'SAP learning',
      'SAP Integration Suite',
      'Cloud Integration',
      'CPI Groovy',
      'XML Formatter',
      'XML Validator',
      'SAP BTP',
    ],
    structuredDataType: 'WebSite',
  },
  '/tools': {
    path: '/tools',
    title: 'Developer Tools — Free SAP Integration Tools | ToolSAP',
    description: 'Free browser-based developer tools for SAP integration development. Format XML, validate payloads, test XPath, convert JSON/XML, and more.',
    canonical: '/tools',
    keywords: ['SAP tools', 'XML formatter', 'XML validator', 'XPath tester', 'SAP developer tools'],
    structuredDataType: 'WebApplication',
  },
  '/learning': {
    path: '/learning',
    title: 'Learning Hub — SAP Integration Development | ToolSAP',
    description: 'Learn SAP Integration Suite development with structured, practical lessons. From foundations to advanced integration patterns.',
    canonical: '/learning',
    keywords: ['SAP learning', 'SAP Integration Suite', 'SAP Cloud Integration', 'SAP tutorial'],
    structuredDataType: 'Article',
  },
  '/learning/integration-development': {
    path: '/learning/integration-development',
    title: 'SAP Integration Development Curriculum | ToolSAP',
    description: 'Comprehensive curriculum for SAP Integration Suite. Master message transformations, Groovy scripting, routing, adapters, and security.',
    canonical: '/learning/integration-development',
    keywords: ['SAP curriculum', 'SAP integration patterns', 'SAP CPI course', 'Groovy scripts'],
    structuredDataType: 'Article',
  },
  '/about': {
    path: '/about',
    title: 'About ToolSAP — Developer Platform for SAP Professionals | ToolSAP',
    description: 'ToolSAP is a developer platform for SAP professionals. Learn SAP technologies and use free developer tools — built for developers who actually build with SAP.',
    canonical: '/about',
    structuredDataType: 'Article',
  },
};

export function getAllRoutesSeo(): RouteSeoData[] {
  const routes: RouteSeoData[] = Object.values(STATIC_PAGE_SEO);

  for (const tool of tools) {
    routes.push({
      path: `/tools/${tool.slug}`,
      title: tool.seo?.title || `${tool.name} — Free Online Tool | ToolSAP`,
      description: tool.seo?.description || tool.description,
      canonical: `/tools/${tool.slug}`,
      keywords: tool.seo?.keywords,
      structuredDataType: 'WebApplication',
    });
  }

  return routes;
}
