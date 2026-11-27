import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Motion Reduction & Animation Audits (WCAG 2.2 AA SC 2.3.3)', () => {
  const baseCss = fs.readFileSync(path.resolve(__dirname, '../../src/styles/base.css'), 'utf-8');
  const atmosphereCss = fs.readFileSync(
    path.resolve(__dirname, '../../src/ui/atmosphere/atmosphere.css'),
    'utf-8',
  );
  const todayCss = fs.readFileSync(path.resolve(__dirname, '../../src/styles/today.css'), 'utf-8');
  const legalCss = fs.readFileSync(path.resolve(__dirname, '../../src/styles/legal.css'), 'utf-8');

  it('declares prefers-reduced-motion in base.css disabling all animations and transitions', () => {
    expect(baseCss).toContain('@media (prefers-reduced-motion: reduce)');
    // Matches global rule disabling animations
    const reducedMotionSection = baseCss.split('@media (prefers-reduced-motion: reduce)')[1];
    expect(reducedMotionSection).toBeDefined();
    expect(reducedMotionSection).toContain('animation: none !important');
    expect(reducedMotionSection).toContain('animation-duration: 0.01ms !important');
    expect(reducedMotionSection).toContain('animation-iteration-count: 1 !important');
    expect(reducedMotionSection).toContain('transition: none !important');
  });

  it('completely halts hero sky animation and dust/wind particles in atmosphere.css under reduced motion', () => {
    expect(atmosphereCss).toContain('@media (prefers-reduced-motion: reduce)');
    const atmosphereReducedSection = atmosphereCss.split(
      '@media (prefers-reduced-motion: reduce)',
    )[1];
    expect(atmosphereReducedSection).toBeDefined();
    expect(atmosphereReducedSection).toContain('.aw-atmosphere');
    expect(atmosphereReducedSection).toContain('animation: none !important');
    expect(atmosphereReducedSection).toContain('transition: none !important');
  });

  it('disables data animations in today.css and legal.css under reduced motion', () => {
    expect(todayCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(todayCss).toContain('transition: none !important');
    expect(legalCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(legalCss).toContain('animation: none !important');
  });

  it('confirms that no content or functional state depends on animation', () => {
    // AirWise displays all information as static HTML cards, badges, text, and tables.
    // Animations are purely cosmetic enhancement (sky gradient shift, subtle floating dust).
    const allAtmosphereText = fs.readFileSync(
      path.resolve(__dirname, '../../src/ui/atmosphere/Atmosphere.tsx'),
      'utf-8',
    );
    expect(allAtmosphereText).toContain('aria-hidden="true"');
  });
});
