// Generate the cover variant of each document from its no-cover source.
// Cover = strip <header.letterhead> and <div.doc-head>, prepend <section.cover>
// (centred masthead: logo + company details · centred title block · bottom-left meta with icons).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(dirname(fileURLToPath(import.meta.url)), 'examples');

function cover(c) {
  const meta = c.meta.map(m =>
    `<div class="m-row"><img src="{{SKILL}}/assets/icons/${m[2]}" alt=""><span><b>${m[0]}</b>&nbsp;&nbsp;${m[1]}</span></div>`
  ).join('\n      ');
  // Company details on the cover only for legal documents.
  const contact = c.showContact ? `
      <div class="cover-contact">
        <div>Asuer (Pty) Ltd</div>
        <div>Ashwood House, Ballywoods Office Park, 33 Ballyclare Drive, Bryanston, 2191</div>
        <div>010 8237 237 &nbsp;&middot;&nbsp; info@asuer.co.za &nbsp;&middot;&nbsp; www.asuer.co.za</div>
      </div>` : '';
  return `  <section class="cover">
    <div class="cover-mast">
      <div class="cover-logo"><img src="{{SKILL}}/assets/asuer-logo-inverted.svg" alt="Asuer"></div>${contact}
    </div>
    <div class="cover-body">
      <p class="cover-kicker">${c.kicker}</p>
      <h1 class="cover-title">${c.title}</h1>
      <p class="cover-subtitle">${c.subtitle}</p>
    </div>
    <div class="cover-meta">
      ${meta}
    </div>
  </section>`;
}

const jobs = [
  { src: 'privacy-policy.html', out: 'privacy-policy-cover.html', stripDocHead: true,
    cover: { kicker: 'Policy', title: 'Privacy Policy', showContact: true,
      subtitle: 'How Asuer collects, uses and protects your personal information.',
      meta: [['Version', '2.0', 'ic_tag.svg'], ['Effective', '1 August 2026', 'ic_calendar.svg'], ['Owner', 'Information Officer', 'ic_user.svg']] } },
  { src: 'business-letter.html', out: 'business-letter-cover.html', stripDocHead: false,
    cover: { kicker: 'Letter', title: 'Letter of appointment',
      subtitle: 'Confirmation of appointment as an independent sales representative.',
      meta: [['Reference', 'AS-2026-0417', 'ic_tag.svg'], ['Date', '17 July 2026', 'ic_calendar.svg']] } },
  { src: 'internal-memo.html', out: 'internal-memo-cover.html', stripDocHead: true,
    cover: { kicker: 'Internal Memo', title: 'Faster funeral claims',
      subtitle: 'A new 48-hour turnaround standard for valid funeral claims.',
      meta: [['Prepared by', 'Sipho Radebe, Operations', 'ic_user.svg'], ['Date', '17 July 2026', 'ic_calendar.svg']] } },
  { src: 'meeting-minutes.html', out: 'meeting-minutes-cover.html', stripDocHead: true,
    cover: { kicker: 'Meeting Minutes', title: 'Product weekly sync',
      subtitle: 'Minutes, decisions and action items from the weekly product meeting.',
      meta: [['Date', 'Thursday, 17 July 2026', 'ic_calendar.svg'], ['Chair', 'Naledi Khumalo', 'ic_user.svg']] } },
  { src: 'specification.html', out: 'specification-cover.html', stripDocHead: true,
    cover: { kicker: 'Specification', title: 'Funeral Quote Builder v2',
      subtitle: 'A stepped, multi-life quoting experience that turns an enquiry into a submitted application in under three minutes.',
      meta: [['Version', '2.0 (draft)', 'ic_tag.svg'], ['Date', '17 July 2026', 'ic_calendar.svg'], ['Author', 'Product &amp; Engineering, Asuer', 'ic_user.svg'], ['Status', 'For review', 'ic_info.svg']] } },
];

for (const j of jobs) {
  let html = readFileSync(join(dir, j.src), 'utf8');
  html = html.replace(/[ \t]*<header class="letterhead">[\s\S]*?<\/header>\s*/, '');
  if (j.stripDocHead) html = html.replace(/[ \t]*<div class="doc-head">[\s\S]*?<\/div>\s*/, '');
  html = html.replace(/[ \t]*<!-- =+ Cover =+ -->\s*/, '');   // tidy any leftover marker
  html = html.replace('<body>', '<body>\n' + cover(j.cover) + '\n');
  writeFileSync(join(dir, j.out), html);
  console.log('wrote', j.out);
}
