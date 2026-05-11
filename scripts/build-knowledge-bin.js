const fs = require('fs');
const path = require('path');

const INPUT_FILES = [
  'landing.json',
  'pricing.json',
  'site.json',
  'Phase-1-Completion-Report-BookFlow.md',
  'PricingTierSaaS.md',
  'README.md',
];

const CHUNK_SIZE = 500;
const OVERLAP = 100;

function chunkText(text, sourceName) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push({ source: sourceName, text: text.slice(start, end) });
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
}

// Convert site.json into a readable format
function flattenSiteJson(site) {
  let sections = [];
  sections.push(`Site name: ${site.site_name}`);
  sections.push(`Tagline: ${site.site_tagline}`);

  for (const [roleKey, roleData] of Object.entries(site.pages)) {
    if (typeof roleData !== 'object') continue;
    sections.push(`\n=== ${roleData.role_suffix || roleKey} pages ===`);

    if (roleData.sidebar) {
      sections.push('Sidebar items:');
      for (const [key, label] of Object.entries(roleData.sidebar)) {
        sections.push(`- ${label}`);
      }
    }

    if (roleData.dashboard?.heading) {
      sections.push(`Dashboard heading: ${roleData.dashboard.heading}`);
    }

    if (roleData.manage_services) {
      sections.push(
        `Manage Services page: ${roleData.manage_services.heading}. ` +
        `Add service form includes: ${roleData.manage_services.form.service_name_label} (placeholder: ${roleData.manage_services.form.service_name_placeholder}), ` +
        `${roleData.manage_services.form.description_label} (placeholder: ${roleData.manage_services.form.description_placeholder}). ` +
        `Button: ${roleData.manage_services.form.add_button}.`
      );
    }

    if (roleData.manage_users) {
      sections.push(
        `Manage Users page: ${roleData.manage_users.heading}. ` +
        `Form fields: ${roleData.manage_users.form.name_label}, ${roleData.manage_users.form.email_label}, etc.`
      );
    }

    if (roleData.manage_appointments) {
      sections.push(
        `Appointments management: ${roleData.manage_appointments.heading}. ` +
        `You can create/edit/view appointments with fields: client, service, employee, date/time, status, notes.`
      );
    }

    // client / employee pages
    if (roleData.book_appointment) {
      sections.push(`Book appointment page: ${roleData.book_appointment.heading || ''} – select service, date/time, phone.`);
    }
  }

  return sections.join('\n');
}

function writeBinary(outputPath, chunks) {
  const buffers = [];
  for (const chunk of chunks) {
    const sourceBuf = Buffer.from(chunk.source, 'utf-8');
    const textBuf = Buffer.from(chunk.text, 'utf-8');
    const sourceLenBuf = Buffer.allocUnsafe(2);
    sourceLenBuf.writeUInt16LE(sourceBuf.length);
    buffers.push(sourceLenBuf, sourceBuf);

    const textLenBuf = Buffer.allocUnsafe(4);
    textLenBuf.writeUInt32LE(textBuf.length);
    buffers.push(textLenBuf, textBuf);
  }
  fs.writeFileSync(outputPath, Buffer.concat(buffers));
  console.log(`✅ Written ${chunks.length} chunks to ${outputPath}`);
}

// Main
const allChunks = [];

// Process the original text files
for (const file of INPUT_FILES) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Skipping missing file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  allChunks.push(...chunkText(content, file));
}

// Add site.json as a readable document
const sitePath = path.join(__dirname, '..', 'site.json');
if (fs.existsSync(sitePath)) {
  const siteData = JSON.parse(fs.readFileSync(sitePath, 'utf-8'));
  const siteText = flattenSiteJson(siteData);
  allChunks.push(...chunkText(siteText, 'site.json'));
  console.log('✅ Included site.json');
}

// Optionally add pricing.json (raw text is fine)
const pricingPath = path.join(__dirname, '..', 'pricing.json');
if (fs.existsSync(pricingPath)) {
  const pricingContent = fs.readFileSync(pricingPath, 'utf-8');
  allChunks.push(...chunkText(pricingContent, 'pricing.json'));
  console.log('✅ Included pricing.json');
}

const outPath = path.join(__dirname, '..', 'public', 'knowledge.bin');
writeBinary(outPath, allChunks);