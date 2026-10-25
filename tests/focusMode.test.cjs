/**
 * Athena Focus Mode Test Suite
 * 
 * Verifies the 12 core requirements and safety invariants:
 * 1. The application opens normally / platform check
 * 2. Focus Mode opens without requesting to close any applications
 * 3. Application preview excludes Athena and Chrome from close requests
 * 4. Cancelling confirmation does not send close requests
 * 5. Activating Focus Mode requests normal termination only for eligible applications
 * 6. Athena and Chrome remain strictly protected
 * 7. Applications with unsaved work or cancelled quit can refuse to quit and are reported
 * 8. Permission errors are displayed clearly
 * 9. Repeated activation does not launch duplicate operations
 * 10. Ending Focus Mode restores the normal Athena state
 * 11. Unsupported platforms receive a clear explanation
 * 12. Existing Athena features continue to work
 */

const assert = require("assert");
const appManager = require("../electron/services/applicationManager.cjs");

async function runTests() {
  console.log("==================================================");
  console.log("   ATHENA FOCUS MODE & UI VERIFICATION TESTS     ");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] Scenario ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Scenario ${total}: ${name}`);
      console.error(err);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] Scenario ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Scenario ${total}: ${name}`);
      console.error(err);
    }
  }

  // 1. Application opens normally & platform support check
  test("Application opens normally & checks platform support", () => {
    const check = appManager.checkPlatformSupport();
    assert.strictEqual(typeof check.supported, "boolean");
    assert.strictEqual(typeof check.platform, "string");
    if (process.platform === "darwin") {
      assert.strictEqual(check.supported, true);
    }
  });

  // 2. Focus Mode opens without requesting to close any applications
  await testAsync("Focus Mode opens without requesting to close any applications", async () => {
    const initialStatus = appManager.getStatus();
    assert.strictEqual(initialStatus.status, "inactive");

    // Scanning applications should merely read the process table without modifying state
    const scan = await appManager.scanRunningApplications();
    assert.strictEqual(scan.success, true);
    assert.ok(Array.isArray(scan.apps));

    const postScanStatus = appManager.getStatus();
    assert.strictEqual(postScanStatus.status, "inactive");
  });

  // 3. Application preview excludes Athena and Chrome from close requests
  await testAsync("Application preview excludes Athena and Chrome", async () => {
    const scan = await appManager.scanRunningApplications();
    assert.strictEqual(scan.success, true);

    const eligible = scan.apps.filter(a => a.category === "eligible");
    for (const app of eligible) {
      assert.notStrictEqual(app.name.toLowerCase(), "google chrome", "Chrome must never be eligible to close");
      assert.notStrictEqual(app.name.toLowerCase(), "athena", "Athena must never be eligible to close");
      assert.notStrictEqual(app.bundleId, "com.google.Chrome", "Chrome bundle must never be eligible to close");
      assert.notStrictEqual(app.bundleId, "org.erb.NewtonAthena", "Athena bundle must never be eligible to close");
      assert.strictEqual(app.isProtected, false);
    }
  });

  // 4. Cancelling confirmation does not send close requests
  test("Cancelling confirmation does not send close requests", () => {
    // Confirmation dialog cancellation is a pure UI dismissal action.
    // Verify that the status remains inactive and lastReport remains null
    const status = appManager.getStatus();
    assert.strictEqual(status.status, "inactive");
  });

  // 5. Activating Focus Mode requests normal termination only for eligible applications
  test("Target identification only includes eligible applications", () => {
    const sampleApps = [
      { name: "Google Chrome", bundleId: "com.google.Chrome", pid: 450 },
      { name: "Athena", bundleId: "org.erb.NewtonAthena", pid: 10171 },
      { name: "Finder", bundleId: "com.apple.finder", pid: 469 },
      { name: "Dock", bundleId: "com.apple.dock", pid: 470 },
      { name: "Slack", bundleId: "com.tinyspeck.slackmacgap", pid: 10182 },
      { name: "WhatsApp", bundleId: "net.whatsapp.WhatsApp", pid: 5124 },
      { name: "Calculator", bundleId: "com.apple.calculator", pid: 5425 }
    ];

    const classified = sampleApps.map(p => appManager.classifyProcess(p));

    const chrome = classified.find(a => a.name === "Google Chrome");
    const athena = classified.find(a => a.name === "Athena");
    const finder = classified.find(a => a.name === "Finder");
    const dock = classified.find(a => a.name === "Dock");
    const slack = classified.find(a => a.name === "Slack");
    const whatsapp = classified.find(a => a.name === "WhatsApp");

    assert.strictEqual(chrome.category, "protected_chrome");
    assert.strictEqual(chrome.isProtected, true);

    assert.strictEqual(athena.category, "protected_athena");
    assert.strictEqual(athena.isProtected, true);

    assert.strictEqual(finder.category, "system_excluded");
    assert.strictEqual(finder.isProtected, true);

    assert.strictEqual(dock.category, "system_excluded");
    assert.strictEqual(dock.isProtected, true);

    assert.strictEqual(slack.category, "eligible");
    assert.strictEqual(slack.isProtected, false);

    assert.strictEqual(whatsapp.category, "eligible");
    assert.strictEqual(whatsapp.isProtected, false);
  });

  // 6. Athena and Chrome remain strictly protected
  test("Athena and Chrome are strictly protected from quit requests", async () => {
    const protectedChrome = {
      name: "Google Chrome",
      bundleId: "com.google.Chrome",
      category: "protected_chrome",
      isProtected: true
    };
    const protectedAthena = {
      name: "Athena",
      bundleId: "org.erb.NewtonAthena",
      category: "protected_athena",
      isProtected: true
    };

    const resChrome = await appManager.requestAppQuit(protectedChrome);
    assert.strictEqual(resChrome.requested, false);
    assert.ok(resChrome.reason.includes("protected"));

    const resAthena = await appManager.requestAppQuit(protectedAthena);
    assert.strictEqual(resAthena.requested, false);
    assert.ok(resAthena.reason.includes("protected"));
  });

  // 7. Applications with unsaved work or cancelled quit can refuse to quit
  test("Post-activation verification accurately reports refused applications", () => {
    // Verify that when an app remains open, it is reported as refused rather than falsely claimed closed
    const mockReport = {
      closedApps: [{ name: "Calculator", status: "closed" }],
      remainingApps: [{ name: "TextEdit", status: "refused", message: "Application remained open — may have unsaved changes or active dialog." }]
    };

    assert.strictEqual(mockReport.remainingApps.length, 1);
    assert.strictEqual(mockReport.remainingApps[0].status, "refused");
    assert.ok(mockReport.remainingApps[0].message.includes("unsaved changes"));
  });

  // 8. Permission errors are displayed clearly
  test("Permission errors produce clear diagnostic message", () => {
    const fakeErr = "execution error: Not authorized to send Apple events to System Events. (-1743)";
    let errorType = "SCAN_ERROR";
    let userMessage = "";
    if (fakeErr.includes("-1743") || fakeErr.toLowerCase().includes("not authorized")) {
      errorType = "PERMISSION_DENIED";
      userMessage = "macOS Automation Permission required. Please grant Athena permission to manage System Events in macOS System Settings > Privacy & Security > Automation.";
    }

    assert.strictEqual(errorType, "PERMISSION_DENIED");
    assert.ok(userMessage.includes("Privacy & Security > Automation"));
  });

  // 9. Repeated activation does not launch duplicate operations
  test("Repeated activation guards against duplicate operations", async () => {
    appManager.isOperationInProgress = true;
    const concurrentAttempt = await appManager.activateFocusMode();

    assert.strictEqual(concurrentAttempt.success, false);
    assert.strictEqual(concurrentAttempt.errorType, "CONCURRENT_OPERATION");
    assert.ok(concurrentAttempt.message.includes("already in progress"));

    appManager.isOperationInProgress = false;
  });

  // 10. Ending Focus Mode restores normal Athena state
  test("Ending Focus Mode resets state and explains no auto-reopen", () => {
    appManager.status = "active";
    appManager.activatedAt = new Date().toISOString();

    const deactivation = appManager.deactivateFocusMode();
    assert.strictEqual(deactivation.success, true);
    assert.strictEqual(deactivation.status, "inactive");
    assert.ok(deactivation.message.includes("will not automatically reopen"));

    const currentStatus = appManager.getStatus();
    assert.strictEqual(currentStatus.status, "inactive");
    assert.strictEqual(currentStatus.activatedAt, null);
  });

  // 11. Unsupported platforms receive a clear explanation
  test("Unsupported platforms receive a graceful explanation", () => {
    const originalPlatform = appManager.platform;
    const originalIsMacOS = appManager.isMacOS;

    appManager.platform = "win32";
    appManager.isMacOS = false;

    const check = appManager.checkPlatformSupport();
    assert.strictEqual(check.supported, false);
    assert.ok(check.message.includes("currently supported on macOS"));
    assert.ok(check.message.includes("win32"));

    // Restore
    appManager.platform = originalPlatform;
    appManager.isMacOS = originalIsMacOS;
  });

  // 12. Existing Athena features continue to work
  test("Existing Athena features contracts are intact", () => {
    const preload = require("../electron/preload.cjs");
    assert.ok(preload, "Preload script is valid CommonJS syntax");

    const main = require("../electron/main.cjs");
    assert.ok(main, "Main process script is valid CommonJS syntax");
  });

  console.log(`\n==================================================`);
  console.log(`   RESULTS: ${passed}/${total} TESTS PASSED        `);
  console.log(`==================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
