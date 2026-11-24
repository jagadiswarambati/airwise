export interface LegalListItem {
  key?: string;
  strong?: string;
  text: string;
  code?: string;
  link?: {
    href: string;
    text: string;
  };
}

export interface LegalList {
  className?: string;
  items: LegalListItem[];
}

export interface LegalSection {
  id: string;
  heading: string;
  tocLabel: string;
  banner?: {
    type: 'warning' | 'info';
    text: string;
  };
  paragraphs?: string[];
  lists?: LegalList[];
  quote?: string;
  codeBlock?: string;
  comparisonGrid?: {
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  contact?: {
    maintainer: string;
    email: string;
  };
}
