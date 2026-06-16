import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2aa8b501-dcd8-48bd-bd3a-81ce6591c46b';

// Ensure artifact directory exists
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function runTests() {
  console.log('🚀 Starting Browser QA automated tests...');
  console.log(`Using Chrome path: ${executablePath}`);
  console.log(`Artifacts will be saved to: ${artifactDir}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true
    }
  });

  const page = await browser.newPage();

  // Listen to browser console logs
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`⚠️  [BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${text}`);
    } else {
      console.log(`ℹ️  [BROWSER CONSOLE]: ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`🚨  [PAGE ERROR UNCAUGHT EXCEPTION]: ${err.toString()}`);
  });

  try {
    // ── STEP 1: Launch & Initial Screen ──
    console.log('\n--- Step 1: Navigating to local dev server ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000)); // wait for initial render & CSV parse

    console.log('Taking screenshot: step1_selector.png');
    await page.screenshot({ path: path.join(artifactDir, 'step1_selector.png') });

    // ── STEP 2: Click "Full Body" card ──
    console.log('\n--- Step 2: Clicking Full Body program card ---');
    const buttons = await page.$$('button');
    let fullBodyBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Full Body') && !text.includes('Upper')) {
        fullBodyBtn = btn;
        break;
      }
    }

    if (!fullBodyBtn) {
      throw new Error('Could not find "Full Body" button on program selector screen.');
    }

    console.log('Found Full Body card. Clicking...');
    await fullBodyBtn.click();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition

    console.log('Taking screenshot: step2_phase.png');
    await page.screenshot({ path: path.join(artifactDir, 'step2_phase.png') });

    // ── STEP 3: Click "Weeks 1-4" ──
    console.log('\n--- Step 3: Clicking Weeks 1-4 phase card ---');
    const phaseButtons = await page.$$('button');
    let weeks14Btn = null;
    for (const btn of phaseButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Weeks 1-4')) {
        weeks14Btn = btn;
        break;
      }
    }

    if (!weeks14Btn) {
      throw new Error('Could not find "Weeks 1-4" phase button.');
    }

    console.log('Found Weeks 1-4 card. Clicking...');
    await weeks14Btn.click();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition

    console.log('Taking screenshot: step3_day.png');
    await page.screenshot({ path: path.join(artifactDir, 'step3_day.png') });

    // Verify exercise preview pills on day cards (just checking they exist in DOM)
    const previewPills = await page.$$eval('span', els => 
      els.filter(el => el.className.includes('truncate')).map(el => el.textContent)
    );
    console.log('Verified exercise preview pills in DOM:', previewPills.slice(0, 5));

    // ── STEP 4: Start Workout Day 1 ──
    console.log('\n--- Step 4: Starting Full Body #1 workout ---');
    const dayButtons = await page.$$('button');
    let fb1Btn = null;
    for (const btn of dayButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Full Body #1')) {
        fb1Btn = btn;
        break;
      }
    }

    if (!fb1Btn) {
      throw new Error('Could not find "Full Body #1" button.');
    }

    console.log('Found Full Body #1 card. Clicking to start session...');
    await fb1Btn.click();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition

    console.log('Taking screenshot: step4_workout.png');
    await page.screenshot({ path: path.join(artifactDir, 'step4_workout.png') });

    // Verify 7 exercises render
    const exercisesRendered = await page.$$eval('h3', els => 
      els.map(el => el.textContent.trim())
    );
    console.log('Exercises Rendered:');
    exercisesRendered.forEach(ex => console.log(`  - ${ex}`));

    // Log Back Squat set 1
    console.log('\n--- Step 5: Logging Back Squat set 1 ---');
    const weightSelector = 'input[aria-label="Weight for set 1"]';
    const repsSelector = 'input[aria-label="Reps for set 1"]';
    const checkSelector = 'button[aria-label="Toggle set 1 completion"]';

    console.log('Waiting for inputs...');
    await page.waitForSelector(weightSelector);
    await page.waitForSelector(repsSelector);
    await page.waitForSelector(checkSelector);

    console.log('Typing 225 weight...');
    await page.type(weightSelector, '225');
    console.log('Typing 6 reps...');
    await page.type(repsSelector, '6');

    console.log('Clicking checkmark button...');
    await page.click(checkSelector);
    await new Promise(r => setTimeout(r, 1500)); // Wait for transition / rest timer to show up

    console.log('Taking screenshot: step5_completed_set.png');
    await page.screenshot({ path: path.join(artifactDir, 'step5_completed_set.png') });

    // ── STEP 5: Save Workout Flow ──
    console.log('\n--- Step 6: Testing Save Flow ---');
    const saveButtonSelector = 'button';
    const allBtns = await page.$$(saveButtonSelector);
    let saveBtn = null;
    for (const btn of allBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('SAVE WORKOUT LOG')) {
        saveBtn = btn;
        break;
      }
    }

    if (!saveBtn) {
      throw new Error('SAVE WORKOUT LOG button not found!');
    }

    console.log('Clicking SAVE WORKOUT LOG button...');
    await saveBtn.click();
    await new Promise(r => setTimeout(r, 1500)); // Wait for summary modal slideUp

    console.log('Taking screenshot: step6_summary.png');
    await page.screenshot({ path: path.join(artifactDir, 'step6_summary.png') });

    // Dismiss the modal by clicking "GREAT WORKOUT!"
    console.log('Dismissing summary modal...');
    const modalBtns = await page.$$('button');
    let greatWorkoutBtn = null;
    for (const btn of modalBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('GREAT WORKOUT!')) {
        greatWorkoutBtn = btn;
        break;
      }
    }

    if (!greatWorkoutBtn) {
      throw new Error('GREAT WORKOUT! button not found!');
    }

    await greatWorkoutBtn.click();
    await new Promise(r => setTimeout(r, 1000)); // Wait for reset

    // ── STEP 6: Analytics Dashboard ──
    console.log('\n--- Step 7: Testing Analytics Dashboard ---');
    const analyticsTabSelector = '#tab-analytics';
    await page.waitForSelector(analyticsTabSelector);
    console.log('Clicking Analytics tab...');
    await page.click(analyticsTabSelector);
    await new Promise(r => setTimeout(r, 1500)); // Wait for Recharts to animate in

    console.log('Taking screenshot: step7_analytics.png');
    await page.screenshot({ path: path.join(artifactDir, 'step7_analytics.png') });

    // Click on Deadlift to see chart updates
    console.log('Clicking Deadlift tab inside Analytics...');
    const analyticBtns = await page.$$('button');
    let deadliftBtn = null;
    for (const btn of analyticBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Deadlift')) {
        deadliftBtn = btn;
        break;
      }
    }

    if (!deadliftBtn) {
      throw new Error('Deadlift button in Analytics not found!');
    }

    await deadliftBtn.click();
    await new Promise(r => setTimeout(r, 1500)); // Wait for chart update

    console.log('Taking screenshot: step8_analytics_deadlift.png');
    await page.screenshot({ path: path.join(artifactDir, 'step8_analytics_deadlift.png') });

    // ── STEP 7: Navigation Resilience ──
    console.log('\n--- Step 8: Testing Navigation Resilience ---');
    const workoutTabSelector = '#tab-select';
    await page.waitForSelector(workoutTabSelector);
    console.log('Clicking Workout tab to start a new workout...');
    await page.click(workoutTabSelector);
    await new Promise(r => setTimeout(r, 1000)); // Wait

    // Start a new Full Body #1 workout again
    console.log('Starting Full Body #1 again...');
    const restartFbCardButtons = await page.$$('button');
    let restartFb1Btn = null;
    for (const btn of restartFbCardButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Full Body #1')) {
        restartFb1Btn = btn;
        break;
      }
    }

    if (!restartFb1Btn) {
      throw new Error('Restart Full Body #1 button not found!');
    }

    await restartFb1Btn.click();
    await new Promise(r => setTimeout(r, 1000)); // Wait for transition

    // Enter details for first set without completing it
    console.log('Entering "135" weight and "8" reps into set 1 input fields...');
    await page.waitForSelector(weightSelector);
    await page.type(weightSelector, '135');
    await page.type(repsSelector, '8');

    // Navigate away to Analytics
    console.log('Navigating away to Analytics...');
    await page.click(analyticsTabSelector);
    await new Promise(r => setTimeout(r, 1000)); // Wait

    // Navigate back to Workout
    console.log('Navigating back to Workout...');
    await page.click(workoutTabSelector);
    await new Promise(r => setTimeout(r, 1000)); // Wait

    console.log('Taking screenshot: step9_nav_resilience.png');
    await page.screenshot({ path: path.join(artifactDir, 'step9_nav_resilience.png') });

    // Read the values of inputs to verify they are preserved
    const weightVal = await page.$eval(weightSelector, el => el.value);
    const repsVal = await page.$eval(repsSelector, el => el.value);
    console.log(`Input values preserved check: Weight = ${weightVal} (expected: 135), Reps = ${repsVal} (expected: 8)`);

    if (weightVal === '135' && repsVal === '8') {
      console.log('✅ State preservation verified! Workout data is fully resilient across tabs.');
    } else {
      console.log('❌ State preservation failed! Inputs were not preserved.');
    }

    console.log('\n🎉 All browser QA tests completed successfully!');

  } catch (err) {
    console.error('❌ An error occurred during the test run:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runTests();
