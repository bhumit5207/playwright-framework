/**
 * helpers/custom-reporter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A custom Playwright reporter that logs test lifecycle events,
 * captures a summary, and writes a timestamped JSON log for each run.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor(options = {}) {
    this.options = options;
    this.results = [];
    this.startTime = Date.now();
    this.outputDir = path.join(process.cwd(), 'reports/custom');

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // ── Lifecycle hooks ───────────────────────────────────────────────────────

  onBegin(config, suite) {
    const total = suite.allTests().length;
    console.log(`\n🚀 Starting ${total} test(s) across ${config.projects.length} project(s)\n`);
    this.startTime = Date.now();
  }

  onTestBegin(test) {
    console.log(`  ▶ [${test.parent.title}] ${test.title}`);
  }

  onTestEnd(test, result) {
    const icon    = result.status === 'passed'  ? '✅'
                  : result.status === 'failed'  ? '❌'
                  : result.status === 'skipped' ? '⏭️'
                  : '⚠️';
    const duration = (result.duration / 1000).toFixed(2);

    console.log(`  ${icon} [${result.status.toUpperCase()}] ${test.title} (${duration}s)`);

    if (result.status === 'failed' && result.error) {
      console.log(`     💬 ${result.error.message?.split('\n')[0]}`);
      if (result.retry > 0) {
        console.log(`     🔁 Retry #${result.retry}`);
      }
    }

    this.results.push({
      title:      test.title,
      suite:      test.parent.title,
      file:       test.location.file,
      status:     result.status,
      duration:   result.duration,
      retry:      result.retry,
      error:      result.error?.message ?? null,
      startedAt:  new Date(result.startTime).toISOString(),
    });
  }

  onEnd(result) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed  = this.results.filter((r) => r.status === 'passed').length;
    const failed  = this.results.filter((r) => r.status === 'failed').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;
    const total   = this.results.length;

    console.log('\n══════════════════════════════════════════════');
    console.log('  Test Run Summary');
    console.log('══════════════════════════════════════════════');
    console.log(`  Total   : ${total}`);
    console.log(`  ✅ Passed : ${passed}`);
    console.log(`  ❌ Failed : ${failed}`);
    console.log(`  ⏭️ Skipped: ${skipped}`);
    console.log(`  ⏱ Duration: ${elapsed}s`);
    console.log(`  Status  : ${result.status.toUpperCase()}`);
    console.log('══════════════════════════════════════════════\n');

    // Write timestamped JSON summary
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `run-${timestamp}.json`);

    const summary = {
      runAt:    new Date().toISOString(),
      status:   result.status,
      duration: parseFloat(elapsed),
      stats:    { total, passed, failed, skipped },
      tests:    this.results,
    };

    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log(`📝 Custom report saved: ${outputFile}`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results
        .filter((r) => r.status === 'failed')
        .forEach((r) => console.log(`   • [${r.suite}] ${r.title}\n     ${r.error}`));
    }
  }

  // ── Optional: output stdout / stderr of each test ─────────────────────────
  onStdOut(chunk, test) {
    // process.stdout.write(chunk);  // uncomment to see test console.log output
  }

  onStdErr(chunk, test) {
    // process.stderr.write(chunk);
  }
}

module.exports = CustomReporter;
