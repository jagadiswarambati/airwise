import React from 'react';
import { Prose } from './Prose';
import { PageHeader } from '../shell/PageHeader';
import { LAST_UPDATED } from '../../config/site';
import { type LegalSection } from '../../content/types';

export interface LegalDocumentProps {
  title: string;
  description: string;
  screenClass: string;
  tocAriaLabel: string;
  sections: LegalSection[];
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    el.focus();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const h1 = document.querySelector('h1');
  if (h1) h1.focus();
}

function LegalToc({ sections, ariaLabel }: { sections: LegalSection[]; ariaLabel: string }) {
  return (
    <aside className="aw-toc" aria-label={ariaLabel}>
      <div className="aw-toc-card card">
        <h2 className="aw-toc-title">On this page</h2>
        <nav>
          <ul className="aw-toc-list">
            {sections.map((item) => (
              <li key={item.id} className="aw-toc-item">
                <button
                  type="button"
                  className="aw-toc-btn"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.tocLabel}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function SectionBanner({ banner }: { banner: NonNullable<LegalSection['banner']> }) {
  return (
    <div className={`banner banner-${banner.type} mb-4`}>
      <p className="font-semibold">{banner.text}</p>
    </div>
  );
}

function SectionGrid({ grid }: { grid: NonNullable<LegalSection['comparisonGrid']> }) {
  return (
    <div className="aw-ai-comparison-grid">
      <div className="card">
        <h3 className="text-sm font-bold text-main mb-2">{grid.leftTitle}</h3>
        <ul className="text-xs text-muted">
          {grid.leftItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3 className="text-sm font-bold text-main mb-2">{grid.rightTitle}</h3>
        <ul className="text-xs text-muted">
          {grid.rightItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SectionContact({ contact }: { contact: NonNullable<LegalSection['contact']> }) {
  return (
    <p>
      <strong>Maintainer:</strong> {contact.maintainer}
      <br />
      <strong>Email:</strong>{' '}
      <a href={`mailto:${contact.email}`} className="aw-inline-link">
        {contact.email}
      </a>
    </p>
  );
}

function LegalSectionItem({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} tabIndex={-1} className="aw-prose-section">
      <h2>{section.heading}</h2>

      {section.banner && <SectionBanner banner={section.banner} />}

      {section.paragraphs && section.paragraphs.length > 0 && (
        <p>{section.paragraphs[0]}</p>
      )}

      {section.comparisonGrid && <SectionGrid grid={section.comparisonGrid} />}

      {section.quote && (
        <blockquote className="aw-legal-quote">{section.quote}</blockquote>
      )}

      {section.lists &&
        section.lists.map((list, listIdx) => (
          <ul key={listIdx} className={list.className}>
            {list.items.map((item, itemIdx) => (
              <li key={itemIdx}>
                {item.key && <code>{item.key}</code>}
                {item.strong && <strong>{item.strong}</strong>}
                {item.code && <code>{item.code}</code>}
                {item.link ? (
                  <>
                    {' Hosted on '}
                    <a
                      href={item.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aw-inline-link"
                    >
                      {item.link.text}
                    </a>
                    {item.text.replace(/^ Hosted on Vercel/, '')}
                  </>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ul>
        ))}

      {section.codeBlock && (
        <pre className="aw-code-block">
          <code>{section.codeBlock}</code>
        </pre>
      )}

      {section.paragraphs &&
        section.paragraphs.slice(1).map((p, idx) => <p key={idx}>{p}</p>)}

      {section.contact && <SectionContact contact={section.contact} />}
    </section>
  );
}

export const LegalDocument: React.FC<LegalDocumentProps> = ({
  title,
  description,
  screenClass,
  tocAriaLabel,
  sections,
}) => {
  return (
    <div className={`aw-screen ${screenClass}`}>
      <PageHeader
        title={title}
        description={description}
        meta={<p className="text-muted text-xs mt-2">Last updated: {LAST_UPDATED}</p>}
      />

      <div className="aw-legal-layout">
        <LegalToc sections={sections} ariaLabel={tocAriaLabel} />

        <div className="aw-legal-content">
          <Prose>
            {sections.map((section) => (
              <LegalSectionItem key={section.id} section={section} />
            ))}

            <div className="aw-back-to-top-wrapper mt-6">
              <button
                type="button"
                className="aw-btn aw-btn-secondary"
                onClick={scrollToTop}
              >
                Back to top ↑
              </button>
            </div>
          </Prose>
        </div>
      </div>
    </div>
  );
};
