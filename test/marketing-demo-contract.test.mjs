import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the demo hero includes the restored accessible logo marquee', async () => {
  const [landing, marquee, styles, englishMessages] = await Promise.all([
    read('src/components/sc_demo/sc_marketing-landing.tsx'),
    read('src/components/sc_demo/sc_logo_marquee.tsx'),
    read('src/styles/project.css'),
    read('messages/en.json'),
  ]);
  const messages = JSON.parse(englishMessages);

  const logoUrls = Array.from(
    { length: 9 },
    (_, index) =>
      new URL(
        `../src/components/sc_demo/assets/logos/demo-logo-${String(index + 1).padStart(2, '0')}.svg`,
        import.meta.url,
      ),
  );
  const logoSources = await Promise.all(
    logoUrls.map(async (logoUrl) => {
      await access(logoUrl);
      return readFile(logoUrl, 'utf8');
    }),
  );

  for (const source of logoSources) {
    const root = source.match(/<svg\b([^>]*)>/)?.[1] ?? '';
    assert.match(root, /\bviewBox="0 0 135 70"/);
    assert.doesNotMatch(root, /\b(?:width|height)=/);
  }

  assert.match(landing, /<SCLogoMarquee label=\{t\('trustedOrganisations'\)\} \/>/);
  assert.match(marquee, /import DemoLogo09 from '@\/components\/sc_demo\/assets\/logos\/demo-logo-09\.svg'/);
  assert.match(marquee, /const demoLogos = \[/);
  assert.match(marquee, /DemoLogo09/);
  assert.doesNotMatch(marquee, /next\/image/);
  assert.doesNotMatch(marquee, /\/images\/sc_demo\/logos/);
  assert.match(marquee, /<DemoLogoSet duplicate \/>/);
  assert.match(marquee, /text-center text-sm/);
  assert.match(marquee, /^'use client';/);
  assert.match(marquee, /requestAnimationFrame/);
  assert.match(marquee, /onPointerEnter=\{slowMarquee\}/);
  assert.match(marquee, /onPointerLeave=\{resumeMarquee\}/);
  assert.doesNotMatch(styles, /@keyframes sc-logo-marquee/);
  assert.doesNotMatch(styles, /animation-play-state:\s*paused/);
  assert.match(styles, /\.sc-logo-marquee-logo\s*\{[\s\S]*?transition:/);
  assert.match(styles, /\.sc-logo-marquee-item:hover \.sc-logo-marquee-logo/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /\.sc-logo-marquee-set\[aria-hidden='true'\]/);
  assert.equal(messages.MarketingLanding.trustedOrganisations, 'Organisations Growing together on Korunet');
});
