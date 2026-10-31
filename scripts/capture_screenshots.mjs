import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TOKTICKIT_ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_ROOT = path.resolve(TOKTICKIT_ROOT, 'artifacts', 'lab-04', 'screenshots');
const LAB4_SCREENSHOTS = path.resolve(TOKTICKIT_ROOT, '..', 'LAB4', 'Screenshort');

const DIRS = [
  path.join(ARTIFACTS_ROOT, 'staff-dashboard'),
  path.join(ARTIFACTS_ROOT, 'requester-dashboard'),
  path.join(ARTIFACTS_ROOT, 'actions-taken'),
  LAB4_SCREENSHOTS,
];

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveDual(subDir, filename, buffer) {
  const p1 = path.join(ARTIFACTS_ROOT, subDir, filename);
  fs.writeFileSync(p1, buffer);
  console.log(`Saved: ${p1}`);

  const mappedName = `${subDir.replace(/-/g, '_')}_${filename}`;
  const p2 = path.join(LAB4_SCREENSHOTS, mappedName);
  fs.writeFileSync(p2, buffer);
  console.log(`Saved: ${p2}`);
}

async function run() {
  console.log('Launching Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  async function login(email, password) {
    console.log(`Logging in as ${email}...`);
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#emailInput', { timeout: 10000 });
    await page.type('#emailInput', email);
    await page.type('#passwordInput', password);
    await page.click('button[type="submit"]');
    
    // Wait for navbar to appear indicating successful authentication
    await page.waitForSelector('.navbar', { timeout: 10000 });
    console.log(`Successfully authenticated as ${email}`);
    await new Promise(r => setTimeout(r, 1000));
  }

  try {
    // 1. Staff Login & Dashboard
    await login('michael.brown@toktickit.com', 'Password123!');

    // Navigate to Dashboard tab
    console.log('Navigating to Staff Dashboard...');
    const dashButtons = await page.$$('button');
    for (const b of dashButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Dashboard')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    // Capture Staff Dashboard at Desktop (1280)
    console.log('Capturing Staff Dashboard (Desktop 1280px)...');
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('staff-dashboard', 'desktop-1280.png', await page.screenshot({ fullPage: true }));

    // Tablet (768)
    console.log('Capturing Staff Dashboard (Tablet 768px)...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('staff-dashboard', 'tablet-768.png', await page.screenshot({ fullPage: true }));

    // Mobile (375)
    console.log('Capturing Staff Dashboard (Mobile 375px)...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('staff-dashboard', 'mobile-375.png', await page.screenshot({ fullPage: true }));

    // 2. Staff Ticket Detail & Actions Taken
    await page.setViewport({ width: 1280, height: 800 });
    console.log('Navigating to Queue...');
    const queueButtons = await page.$$('button');
    for (const b of queueButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Queue')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    // Click first ticket row in queue
    console.log('Opening Ticket Detail for Actions Taken...');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const firstRow = await page.$('table tbody tr');
    if (firstRow) {
      await firstRow.click();
    }
    await new Promise(r => setTimeout(r, 2000));

    // Actions Taken Panel Desktop
    console.log('Capturing Actions Taken Panel (Desktop)...');
    saveDual('actions-taken', 'actions-panel-desktop.png', await page.screenshot({ fullPage: true }));

    // Actions Taken Panel Mobile
    console.log('Capturing Actions Taken Panel (Mobile)...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('actions-taken', 'actions-panel-mobile.png', await page.screenshot({ fullPage: true }));

    // Back to Desktop to capture modals
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));

    // Open Record Action Modal
    console.log('Opening Record Action Modal...');
    const recordButtons = await page.$$('button');
    for (const b of recordButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Record Action')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    saveDual('actions-taken', 'record-action-modal.png', await page.screenshot());

    // Close Record Action Modal
    const cancelButtons = await page.$$('button');
    for (const b of cancelButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && (text.includes('Cancel') || text.includes('Close'))) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // 3. Requester Login & Dashboard
    await login('jennifer.anderson@example.com', 'Password123!');

    console.log('Navigating to Requester Dashboard...');
    const reqDashButtons = await page.$$('button');
    for (const b of reqDashButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Dashboard')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    // Requester Dashboard Desktop
    console.log('Capturing Requester Dashboard (Desktop 1280px)...');
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('requester-dashboard', 'desktop-1280.png', await page.screenshot({ fullPage: true }));

    // Requester Dashboard Tablet
    console.log('Capturing Requester Dashboard (Tablet 768px)...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('requester-dashboard', 'tablet-768.png', await page.screenshot({ fullPage: true }));

    // Requester Dashboard Mobile
    console.log('Capturing Requester Dashboard (Mobile 375px)...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    saveDual('requester-dashboard', 'mobile-375.png', await page.screenshot({ fullPage: true }));

    console.log('ALL SCREENSHOTS CAPTURED PERFECTLY!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
