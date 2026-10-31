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
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    console.log('Logging in as IT Staff...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#emailInput', { timeout: 10000 });
    await page.type('#emailInput', 'michael.brown@toktickit.com');
    await page.type('#passwordInput', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.navbar', { timeout: 10000 });

    // Open Queue
    console.log('Opening Staff Queue...');
    const queueButtons = await page.$$('button');
    for (const b of queueButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Queue')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Open first ticket
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rows = await page.$$('table tbody tr');
    if (rows.length > 0) {
      await rows[0].click();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Status transition selector
    console.log('Testing resolution gate...');
    await page.waitForSelector('#ticketStatusSelect', { timeout: 10000 });
    
    // Select RESOLVED
    const options = await page.$$eval('#ticketStatusSelect option', opts => opts.map(o => o.value));
    console.log('Status options:', options);

    if (options.includes('RESOLVED')) {
      await page.select('#ticketStatusSelect', 'RESOLVED');
      await new Promise(r => setTimeout(r, 500));

      // Attempt to submit empty to trigger resolution gate validation error
      const submitBtn = await page.$('form button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 500));
      }
      
      saveDual('actions-taken', 'resolution-modal.png', await page.screenshot());
      console.log('Captured resolution gate / modal screenshot!');
    } else {
      // Find a ticket that allows RESOLVED or change to IN_PROGRESS first
      if (options.includes('IN_PROGRESS')) {
        await page.select('#ticketStatusSelect', 'IN_PROGRESS');
        const submitBtn = await page.$('form button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await new Promise(r => setTimeout(r, 1500));

        // Now select RESOLVED
        await page.select('#ticketStatusSelect', 'RESOLVED');
        await new Promise(r => setTimeout(r, 500));
        const submitBtn2 = await page.$('form button[type="submit"]');
        if (submitBtn2) await submitBtn2.click();
        await new Promise(r => setTimeout(r, 500));

        saveDual('actions-taken', 'resolution-modal.png', await page.screenshot());
        console.log('Captured resolution gate / modal screenshot after IN_PROGRESS!');
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
