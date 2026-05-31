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
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.jsAlertBtn.click();
    const dialog = await dialogPromise;
    logger.info(`Alert message: ${dialog.message()}`);
    await dialog.accept();
    return dialog.message();
  }

  // ── Confirm dialog ────────────────────────────────────────────────────────

  async triggerAndAcceptConfirm() {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.jsConfirmBtn.click();
    const dialog = await dialogPromise;
    await dialog.accept();
    return dialog.message();
  }

  async triggerAndDismissConfirm() {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.jsConfirmBtn.click();
    const dialog = await dialogPromise;
    await dialog.dismiss();
    return dialog.message();
  }

  // ── Prompt dialog ─────────────────────────────────────────────────────────

  async triggerPromptWithInput(text) {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.jsPromptBtn.click();
    const dialog = await dialogPromise;
    await dialog.accept(text);
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
    await this.iframeBody.click();
    await this.iframeBody.fill(text);
  }

  async getIframeBodyText() {
    return this.iframeBody.innerText();
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
    await this.page.locator(`a:text("${headerText}")`).first().click();
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
      this.newTabLink.click(),
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
