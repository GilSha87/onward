#!/usr/bin/env node
// scripts/check-i18n.js
// Usage: node scripts/check-i18n.js   (or: npm run check:i18n)
// Reports translation keys present in 'en' but missing in other locales,
// plus any "[TRANSLATE: ...]" placeholders still awaiting translation.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const BASE_LANG = 'en';

function flattenKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      acc.push(...flattenKeys(obj[key], fullKey));
    } else {
      acc.push(fullKey);
    }
    return acc;
  }, []);
}

function flattenEntries(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      acc.push(...flattenEntries(obj[key], fullKey));
    } else {
      acc.push([fullKey, obj[key]]);
    }
    return acc;
  }, []);
}

function loadLocale(lang) {
  const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  Locale file not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`  ❌  Failed to parse ${filePath}: ${e.message}`);
    return null;
  }
}

function run() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`❌ Locales dir not found: ${LOCALES_DIR}`);
    process.exit(1);
  }

  const baseLocale = loadLocale(BASE_LANG);
  if (!baseLocale) {
    console.error(`❌ Base locale '${BASE_LANG}' not found. Aborting.`);
    process.exit(1);
  }

  const baseKeys = flattenKeys(baseLocale);
  console.log(`\n✅ Base locale '${BASE_LANG}': ${baseKeys.length} keys\n`);

  const allLangs = fs.readdirSync(LOCALES_DIR)
    .filter(f => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory() && f !== BASE_LANG);

  let totalMissing = 0;
  let totalUntranslated = 0;

  for (const lang of allLangs) {
    const locale = loadLocale(lang);
    if (!locale) continue;

    const localeKeys = new Set(flattenKeys(locale));
    const missingKeys = baseKeys.filter(k => !localeKeys.has(k));
    const extraKeys = flattenKeys(locale).filter(k => !baseKeys.includes(k));
    const untranslated = flattenEntries(locale)
      .filter(([, v]) => typeof v === 'string' && v.includes('[TRANSLATE:'))
      .map(([k]) => k);

    if (missingKeys.length === 0) {
      console.log(`✅ ${lang}: complete (${localeKeys.size} keys)`);
    } else {
      totalMissing += missingKeys.length;
      console.log(`❌ ${lang}: ${missingKeys.length} missing keys`);
      missingKeys.forEach(k => console.log(`     missing: ${k}`));
    }

    if (untranslated.length > 0) {
      totalUntranslated += untranslated.length;
      console.log(`   📝 ${lang}: ${untranslated.length} untranslated placeholders ([TRANSLATE: ...])`);
    }

    if (extraKeys.length > 0) {
      console.log(`   ⚠️  ${lang}: ${extraKeys.length} extra keys (not in base):`);
      extraKeys.forEach(k => console.log(`     extra: ${k}`));
    }
    console.log('');
  }

  if (totalUntranslated > 0) {
    console.log(`📝 Total untranslated placeholders across all locales: ${totalUntranslated}`);
  }

  if (totalMissing > 0) {
    console.log(`\n⚠️  Total missing keys across all locales: ${totalMissing}`);
    process.exit(1);
  } else {
    console.log('\n🎉 All locales have every base key!');
    process.exit(0);
  }
}

run();
