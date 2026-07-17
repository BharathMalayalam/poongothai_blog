/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  year: number;
  type: 'conference' | 'journal';
  link?: string;
  abstract: string;
}

export interface InfoHighlight {
  label: string;
  value: string;
  iconName: string;
  detailTitle: string;
  detailDesc: string;
}
