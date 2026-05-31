/**
 * pages/AlertPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for JS Alerts (https://the-internet.herokuapp.com/javascript_alerts).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const logger = require('../helpers/logger');

class AlertPage extends BasePage {
  constructor(page) {
    super(page);

    this.jsAlertBtn    = page.locator("button[onclick='jsAlert()']");
    this.jsConfirmBtn  = page.locator("button[onclick='jsConfirm()']");
    this.jsPromptBtn   = page.locator("button[onclick='jsPrompt()']");
    this.result        = page.locator('#result');
  }

  async open() {
    await this.navigateTo('/javascript_alerts');
  }

  // ── Simple alert ─────────────────────────────────────────────────────────

  async triggerAndAcceptAlert() {
    logger.info('Triggering JS alert and accepting');
    const msgPromise = new Promise((resolve) => {
      this.page.once('dialog', (dialog) => {
        logger.info(`Alert message: ${dialog.message()}`);
        try {
          dialog.accept();
        } catch (e) {
          logger.warn(`Dialog accept failed: ${e.message}`);
        }
        resolve(dialog.message());
      });
    });

    await this.clickSelectorFallback("button[onclick='jsAlert()']");
    return msgPromise;
  }

  // ── Confirm dialog ────────────────────────────────────────────────────────

  async triggerAndAcceptConfirm() {
    const msgPromise = new Promise((resolve) => {
      this.page.once('dialog', (dialog) => {
        try { dialog.accept(); } catch (e) { logger.warn(`Dialog accept failed: ${e.message}`); }
        resolve(dialog.message());
      });
    });
    await this.clickSelectorFallback("button[onclick='jsConfirm()']");
    return msgPromise;
  }

  async triggerAndDismissConfirm() {
    const msgPromise = new Promise((resolve) => {
      this.page.once('dialog', (dialog) => {
        try { dialog.dismiss(); } catch (e) { logger.warn(`Dialog dismiss failed: ${e.message}`); }
        resolve(dialog.message());
      });
    });
    await this.clickSelectorFallback("button[onclick='jsConfirm()']");
    return msgPromise;
  }

  // ── Prompt dialog ─────────────────────────────────────────────────────────

  async triggerPromptWithInput(text) {
    const msgPromise = new Promise((resolve) => {
      this.page.once('dialog', (dialog) => {
        try { dialog.accept(text); } catch (e) { logger.warn(`Dialog accept failed: ${e.message}`); }
        resolve(dialog.message());
      });
    });
    await this.clickSelectorFallback("button[onclick='jsPrompt()']");
    return msgPromise;
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async assertResult(expected) {
    await expect(this.result).toContainText(expected);
  }

  async getResult() {
    return this.result.innerText();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FramePage
// ─────────────────────────────────────────────────────────────────────────────

class FramePage extends BasePage {
  constructor(page) {
    super(page);
    // Nested frames demo
    this.frameLocator       = page.frameLocator('#mce_0_ifr');
    this.iframeBody         = page.frameLocator('#mce_0_ifr').locator('body');
    this.nestedTopFrame     = page.frameLocator('[name="frame-top"]');
    this.nestedMiddleFrame  = page.frameLocator('[name="frame-top"]').frameLocator('[name="frame-middle"]');
  }

  async openNestedFrames() {
    await this.navigateTo('/nested_frames');
  }

  async openIframePage() {
    await this.navigateTo('/iframe');
  }

  async getTopFrameText() {
    return this.nestedTopFrame.frameLocator('[name="frame-top"]').locator('body').innerText().catch(() => '');
  }

  async typeInIframe(text) {
    // Try multiple approaches to type in the iframe
    try {
      // First, try using frameLocator and interact with the contentFrame
      const frameHandle = await this.page.frameLocator('#mce_0_ifr');
      const bodyElement = frameHandle.locator('body');
      
      // Check if body is accessible
      const isVisible = await bodyElement.isVisible().catch(() => false);
      if (!isVisible) throw new Error('Body not visible in iframe');
      
      // For read-only editors, try to click and type
      await bodyElement.click({ force: true });
      await this.page.keyboard.type(text);
    } catch (e1) {
      // Fallback: try direct frame evaluation
      try {
        const iframeHandle = await this.page.$('#mce_0_ifr');
        if (!iframeHandle) throw new Error('iFrame element not found');
        const frame = await iframeHandle.contentFrame();
        if (!frame) throw new Error('Unable to get content frame');
        await frame.locator('body').click({ force: true });
        await frame.locator('body').fill(text);
      } catch (e2) {
        logger.warn(`Failed to type in iframe: ${e1.message}, ${e2.message}`);
        throw e1;
      }
    }
  }

  async getIframeBodyText() {
    try {
      return await this.iframeBody.innerText();
    } catch (e) {
      // If TinyMCE is read-only, try to get text from the editor toolbar area
      const content = await this.page.locator('div.tox-tinymce-aux').innerText().catch(() => '');
      return content || '';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TablePage
// ─────────────────────────────────────────────────────────────────────────────

class TablePage extends BasePage {
  constructor(page) {
    super(page);
    this.table1 = page.locator('#table1');
    this.table2 = page.locator('#table2');
    this.table1Rows = page.locator('#table1 tbody tr');
  }

  async open() {
    await this.navigateTo('/tables');
  }

  /** Return the text of a specific cell (1-based row and column). */
  async getCellText(tableSelector, row, col) {
    return this.page
      .locator(`${tableSelector} tbody tr:nth-child(${row}) td:nth-child(${col})`)
      .innerText();
  }

  /** Return an array of all texts in a column (1-based). */
  async getColumnValues(tableSelector, col) {
    return this.page
      .locator(`${tableSelector} tbody tr td:nth-child(${col})`)
      .allInnerTexts();
  }

  /** Return the row count of a table body. */
  async getRowCount(tableSelector) {
    return this.page.locator(`${tableSelector} tbody tr`).count();
  }

  /** Return the column header texts. */
  async getHeaders(tableSelector) {
    return this.page.locator(`${tableSelector} thead th`).allInnerTexts();
  }

  /**
   * Click the sort link for a given column header text.
   * @param {string} headerText  e.g. 'Last Name'
   */
  async sortByColumn(headerText) {
    // Get all header cells in the table
    const headerCells = await this.page.locator(`#table1 thead th`).all();
    
    for (const cell of headerCells) {
      const text = await cell.innerText().catch(() => '');
      // Check if this cell's text contains the header we're looking for
      if (text && text.trim().includes(headerText)) {
        // Found the right header cell - now find and click the link inside it
        const link = cell.locator('a').first();
        try {
          // Check if link exists and is visible
          const isVisible = await link.isVisible().catch(() => false);
          if (isVisible) {
            await link.click();
            return;
          }
        } catch (e) {
          logger.warn(`Link not visible in header cell: ${e.message}`);
        }
      }
    }
    
    // If we get here, the header was not found or link couldn't be clicked
    throw new Error(`Unable to find and click sort link for "${headerText}"`);
  }

  /**
   * Find a row that contains all of the given cell values and return its index.
   * Returns -1 if not found.
   */
  async findRowByValues(tableSelector, ...cellValues) {
    const rows = await this.page.locator(`${tableSelector} tbody tr`).all();
    for (let i = 0; i < rows.length; i++) {
      const texts = await rows[i].locator('td').allInnerTexts();
      if (cellValues.every((v) => texts.some((t) => t.includes(v)))) {
        return i + 1; // 1-based
      }
    }
    return -1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DragDropPage
// ─────────────────────────────────────────────────────────────────────────────

class DragDropPage extends BasePage {
  constructor(page) {
    super(page);
    this.sourceColumn = page.locator('#column-a');
    this.targetColumn = page.locator('#column-b');
    this.sourceHeader = page.locator('#column-a header');
    this.targetHeader = page.locator('#column-b header');
  }

  async open() {
    await this.navigateTo('/drag_and_drop');
  }

  async dragAToB() {
    await this.sourceColumn.dragTo(this.targetColumn);
  }

  async getColumnAHeader() {
    return this.sourceHeader.innerText();
  }

  async getColumnBHeader() {
    return this.targetHeader.innerText();
  }

  async assertColumnsSwapped() {
    await expect(this.sourceHeader).toContainText('B');
    await expect(this.targetHeader).toContainText('A');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WindowPage
// ─────────────────────────────────────────────────────────────────────────────

class WindowPage extends BasePage {
  constructor(page) {
    super(page);
    this.newTabLink = page.locator('a[href="/windows/new"]');
  }

  async open() {
    await this.navigateTo('/windows');
  }

  /**
   * Click the "Click Here" link and return the new Page object.
   */
  async openNewWindow() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.evaluate(() => document.querySelector('a[href="/windows/new"]').click()),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  async getNewWindowTitle(newPage) {
    return newPage.title();
  }

  async closeNewWindowAndSwitch(newPage) {
    await newPage.close();
    await this.page.bringToFront();
  }
}

module.exports = { AlertPage, FramePage, TablePage, DragDropPage, WindowPage };
