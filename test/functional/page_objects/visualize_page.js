/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { VisualizeConstants } from '../../../src/legacy/core_plugins/kibana/public/visualize/visualize_constants';
import Bluebird from 'bluebird';
import expect from 'expect.js';

export function VisualizePageProvider({ getService, getPageObjects }) {
  const browser = getService('browser');
  const config = getService('config');
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');
  const find = getService('find');
  const log = getService('log');
  const inspector = getService('inspector');
  const table = getService('table');
  const globalNav = getService('globalNav');
  const PageObjects = getPageObjects(['common', 'header']);
  const defaultFindTimeout = config.get('timeouts.find');

  class VisualizePage {

    get index() {
      return {
        LOGSTASH_TIME_BASED: 'logstash-*',
        LOGSTASH_NON_TIME_BASED: 'logstash*'
      };
    }

    async navigateToNewVisualization() {
      log.debug('navigateToApp visualize');
      await PageObjects.common.navigateToApp('visualize');
      await testSubjects.click('createNewVis');
      await this.waitForVisualizationSelectPage();
    }

    async waitForVisualizationSelectPage() {
      await retry.try(async () => {
        const visualizeSelectTypePage = await testSubjects.find('visNewDialogTypes');
        if (!await visualizeSelectTypePage.isDisplayed()) {
          throw new Error('wait for visualization select page');
        }
      });
    }

    async clickVisType(type) {
      await testSubjects.click(`visType-${type}`);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickAreaChart() {
      await this.clickVisType('area');
    }

    async clickDataTable() {
      await this.clickVisType('table');
    }

    async clickLineChart() {
      await this.clickVisType('line');
    }

    async clickRegionMap() {
      await this.clickVisType('region_map');
    }

    async clickMarkdownWidget() {
      await this.clickVisType('markdown');
    }

    async clickAddMetric() {
      await find.clickByCssSelector('[group-name="metrics"] [data-test-subj="visualizeEditorAddAggregationButton"]');
    }

    async clickAddBucket() {
      await find.clickByCssSelector('[group-name="buckets"] [data-test-subj="visualizeEditorAddAggregationButton"]');
    }

    async clickMetric() {
      await this.clickVisType('metric');
    }

    async clickGauge() {
      await this.clickVisType('gauge');
    }

    async clickPieChart() {
      await this.clickVisType('pie');
    }

    async clickTileMap() {
      await this.clickVisType('tile_map');
    }

    async clickTagCloud() {
      await this.clickVisType('tagcloud');
    }

    async clickVega() {
      await this.clickVisType('vega');
    }

    async clickVisualBuilder() {
      await this.clickVisType('metrics');
    }

    async clickEditorSidebarCollapse() {
      await testSubjects.click('collapseSideBarButton');
    }

    async selectTagCloudTag(tagDisplayText) {
      await testSubjects.click(tagDisplayText);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async getTextTag() {
      await this.waitForVisualization();
      const elements = await find.allByCssSelector('text');
      return await Promise.all(elements.map(async element => await element.getVisibleText()));
    }

    async getTextSizes() {
      const tags = await find.allByCssSelector('text');
      async function returnTagSize(tag) {
        const style = await tag.getAttribute('style');
        return style.match(/font-size: ([^;]*);/)[1];
      }
      return await Promise.all(tags.map(returnTagSize));
    }

    async clickVerticalBarChart() {
      await this.clickVisType('histogram');
    }

    async clickHeatmapChart() {
      await this.clickVisType('heatmap');
    }

    async clickInputControlVis() {
      await this.clickVisType('input_control_vis');
    }

    async getChartTypes() {
      const chartTypeField = await testSubjects.find('visNewDialogTypes');
      const chartTypes = await chartTypeField.findAllByTagName('button');
      async function getChartType(chart) {
        const label = await testSubjects.findDescendant('visTypeTitle', chart);
        return await label.getVisibleText();
      }
      const getChartTypesPromises = chartTypes.map(getChartType);
      return await Promise.all(getChartTypesPromises);
    }

    async selectVisSourceIfRequired() {
      log.debug('selectVisSourceIfRequired');
      const selectPage = await testSubjects.findAll('visualizeSelectSearch');
      if (selectPage.length) {
        log.debug('a search is required for this visualization');
        await this.clickNewSearch();
      }
    }

    async getExperimentalTypeLinks() {
      return await find.allByCssSelector('[data-vis-stage="experimental"]');
    }

    async isExperimentalInfoShown() {
      return await testSubjects.exists('experimentalVisInfo');
    }

    async getExperimentalInfo() {
      return await testSubjects.find('experimentalVisInfo');
    }

    async clickAbsoluteButton() {
      await find.clickByCssSelector(
        'ul.nav.nav-pills.nav-stacked.kbn-timepicker-modes:contains("absolute")',
        defaultFindTimeout * 2);
    }

    async clickDropPartialBuckets() {
      return await testSubjects.click('dropPartialBucketsCheckbox');
    }

    async setMarkdownTxt(markdownTxt) {
      const input = await testSubjects.find('markdownTextarea');
      await input.clearValue();
      await input.type(markdownTxt);
    }

    async getMarkdownText() {
      const markdownContainer = await testSubjects.find('markdownBody');
      return markdownContainer.getVisibleText();
    }

    async getMarkdownBodyDescendentText(selector) {
      const markdownContainer = await testSubjects.find('markdownBody');
      const element = await find.descendantDisplayedByCssSelector(selector, markdownContainer);
      return element.getVisibleText();
    }

    async getVegaSpec() {
      // Adapted from console_page.js:getVisibleTextFromAceEditor(). Is there a common utilities file?
      const editor = await testSubjects.find('vega-editor');
      const lines = await editor.findAllByClassName('ace_line_group');
      const linesText = await Bluebird.map(lines, l => l.getVisibleText());
      return linesText.join('\n');
    }

    async getVegaViewContainer() {
      return await find.byCssSelector('div.vgaVis__view');
    }

    async getVegaControlContainer() {
      return await find.byCssSelector('div.vgaVis__controls');
    }

    async addInputControl() {
      await testSubjects.click('inputControlEditorAddBtn');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async inputControlSubmit() {
      await testSubjects.click('inputControlSubmitBtn');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async inputControlClear() {
      await testSubjects.click('inputControlClearBtn');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async checkCheckbox(selector) {
      const element = await testSubjects.find(selector);
      const isSelected = await element.isSelected();
      if(!isSelected) {
        log.debug(`checking checkbox ${selector}`);
        await testSubjects.click(selector);
      }
    }

    async uncheckCheckbox(selector) {
      const element = await testSubjects.find(selector);
      const isSelected = await element.isSelected();
      if(isSelected) {
        log.debug(`unchecking checkbox ${selector}`);
        await testSubjects.click(selector);
      }
    }

    async setSelectByOptionText(selectId, optionText) {
      const options = await find.allByCssSelector(`#${selectId} > option`);
      const optionsTextPromises = options.map(async (optionElement) => {
        return await optionElement.getVisibleText();
      });
      const optionsText = await Promise.all(optionsTextPromises);

      const optionIndex = optionsText.indexOf(optionText);
      if (optionIndex === -1) {
        throw new Error(`Unable to find option '${optionText}' in select ${selectId}. Available options: ${optionsText.join(',')}`);
      }
      await options[optionIndex].click();
    }

    async getSideEditorExists() {
      return await find.existsByCssSelector('.collapsible-sidebar');
    }

    async setInspectorTablePageSize(size) {
      const panel = await testSubjects.find('inspectorPanel');
      await find.clickByButtonText('Rows per page: 20', panel);
      // The buttons for setting table page size are in a popover element. This popover
      // element appears as if it's part of the inspectorPanel but it's really attached
      // to the body element by a portal.
      const tableSizesPopover = await find.byCssSelector('.euiPanel');
      await find.clickByButtonText(`${size} rows`, tableSizesPopover);
    }

    async getMetric() {
      const metricElement = await find.byCssSelector('div[ng-controller="KbnMetricVisController"]');
      return await metricElement.getVisibleText();
    }

    async getGaugeValue() {
      const elements = await find.allByCssSelector('[data-test-subj="visualizationLoader"] .chart svg');
      return await Promise.all(elements.map(async element => await element.getVisibleText()));
    }

    async clickMetricEditor() {
      await find.clickByCssSelector('button[data-test-subj="toggleEditor"]');
    }

    async clickNewSearch(indexPattern = this.index.LOGSTASH_TIME_BASED) {
      await testSubjects.click(`savedObjectTitle${indexPattern.split(' ').join('-')}`);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickSavedSearch(savedSearchName) {
      await testSubjects.click('savedSearchesTab');
      await testSubjects.click(`savedObjectTitle${savedSearchName.split(' ').join('-')}`);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickUnlinkSavedSearch() {
      await testSubjects.doubleClick('unlinkSavedSearch');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async setValue(newValue) {
      await find.clickByCssSelector('button[ng-click="numberListCntr.add()"]', defaultFindTimeout * 2);
      const input = await find.byCssSelector('input[ng-model="numberListCntr.getList()[$index]"]');
      await input.clearValue();
      await input.type(newValue);
    }

    async selectSearch(searchName) {
      await find.clickByLinkText(searchName);
    }

    async getErrorMessage() {
      const element = await find.byCssSelector('.item>h4');
      return await element.getVisibleText();
    }

    // clickBucket(bucketType) 'X-Axis', 'Split Area', 'Split Chart'
    async clickBucket(bucketName, type = 'bucket') {
      const testSubject = type === 'bucket' ? 'bucketsAggGroup' : 'metricsAggGroup';
      const locator = `[data-test-subj="${testSubject}"] .list-group-menu-item[data-test-subj="${bucketName}"]`;
      await find.clickByCssSelector(locator);
    }

    async selectAggregation(myString, groupName = 'buckets', childAggregationType = null) {
      const selector = `
        [group-name="${groupName}"]
        vis-editor-agg-params:not(.ng-hide)
        ${childAggregationType ? `vis-editor-agg-params[group-name="'${childAggregationType}'"]:not(.ng-hide)` : ''}
        .agg-select
      `;

      await retry.try(async () => {
        await find.clickByCssSelector(selector);
        const input = await find.byCssSelector(`${selector} input.ui-select-search`);
        await input.type(myString);
        await input.pressKeys(browser.keys.RETURN);
      });
      await PageObjects.common.sleep(500);
    }

    async applyFilters() {
      return await testSubjects.click('filterBarApplyFilters');
    }
    /**
     * Set the test for a filter aggregation.
     * @param {*} filterValue the string value of the filter
     * @param {*} filterIndex used when multiple filters are configured on the same aggregation
     * @param {*} aggregationId the ID if the aggregation. On Tests, it start at from 2
     */
    async setFilterAggregationValue(filterValue, filterIndex = 0, aggregationId = 2) {
      await testSubjects.setValue(`visEditorFilterInput_${aggregationId}_${filterIndex}`, filterValue);
    }

    async addNewFilterAggregation() {
      return await testSubjects.click('visEditorAddFilterButton');
    }

    async toggleOpenEditor(index, toState = 'true') {
      // index, see selectYAxisAggregation
      const toggle = await find.byCssSelector(`button[aria-controls="visAggEditorParams${index}"]`);
      const toggleOpen = await toggle.getAttribute('aria-expanded');
      log.debug(`toggle ${index} expand = ${toggleOpen}`);
      if (toggleOpen !== toState) {
        log.debug(`toggle ${index} click()`);
        await toggle.click();
      }
    }

    async selectYAxisAggregation(agg, field, label, index = 1) {
      // index starts on the first "count" metric at 1
      // Each new metric or aggregation added to a visualization gets the next index.
      // So to modify a metric or aggregation tests need to keep track of the
      // order they are added.
      await this.toggleOpenEditor(index);
      const aggSelect = await find
        .byCssSelector(`#visAggEditorParams${index} div [data-test-subj="visEditorAggSelect"] div span[aria-label="Select box activate"]`);
      // open agg selection list
      await aggSelect.click();
      // select our agg
      const aggItem = await find.byCssSelector(`[data-test-subj="${agg}"]`);
      await aggItem.click();
      const fieldSelect = await find
        .byCssSelector(`#visAggEditorParams${index} > [agg-param="agg.type.params[0]"] > div > div > div.ui-select-match > span`);
      // open field selection list
      await fieldSelect.click();
      // select our field
      await testSubjects.click(field);
      // enter custom label
      await this.setCustomLabel(label, index);
    }

    async setCustomLabel(label, index = 1) {
      const customLabel = await find.byCssSelector(`#visEditorStringInput${index}customLabel`);
      customLabel.type(label);
    }

    async setAxisExtents(min, max, axis = 'LeftAxis-1') {
      const axisOptions = await find.byCssSelector(`div[aria-label="Toggle ${axis} options"]`);
      const isOpen = await axisOptions.getAttribute('aria-expanded');
      if (isOpen === 'false') {
        log.debug(`click to open ${axis} options`);
        await axisOptions.click();
      }
      // it would be nice to get the correct axis by name like "LeftAxis-1"
      // instead of an incremented index, but this link isn't under the div above
      const advancedLink =
        await find.byCssSelector(`#axisOptionsValueAxis-1 .visEditorSidebar__advancedLinkIcon`);

      const advancedLinkState = await advancedLink.getAttribute('type');
      if (advancedLinkState.includes('arrowRight')) {
        await advancedLink.moveMouseTo();
        log.debug('click advancedLink');
        await advancedLink.click();
      }
      const checkbox = await find.byCssSelector('input[ng-model="axis.scale.setYExtents"]');
      const checkboxState = await checkbox.getAttribute('class');
      if (checkboxState.includes('ng-empty')) {
        await checkbox.moveMouseTo();
        await checkbox.click();
      }
      const maxField = await find.byCssSelector('[ng-model="axis.scale.max"]');
      await maxField.type(max);
      const minField = await find.byCssSelector('[ng-model="axis.scale.min"]');
      await minField.type(min);

    }

    async getField() {
      const field = await retry.try(
        async () => await find.byCssSelector('.ng-valid-required[name="field"] .ui-select-match-text'));
      return await field.getVisibleText();
    }

    async selectField(fieldValue, groupName = 'buckets', childAggregationType = null) {
      log.debug(`selectField ${fieldValue}`);
      const selector = `
        [group-name="${groupName}"]
        vis-editor-agg-params:not(.ng-hide)
        ${childAggregationType ? `vis-editor-agg-params[group-name="'${childAggregationType}'"]:not(.ng-hide)` : ''}
        .field-select
      `;
      await find.clickByCssSelector(selector);
      await find.setValue(`${selector} input.ui-select-search`, fieldValue);
      const input = await find.byCssSelector(`${selector} input.ui-select-search`);
      await input.pressKeys(browser.keys.RETURN);
    }

    async selectFieldById(fieldValue, id) {
      await find.clickByCssSelector(`#${id} > option[label="${fieldValue}"]`);
    }

    async orderBy(fieldValue) {
      await find.clickByCssSelector(
        'select.form-control.ng-pristine.ng-valid.ng-untouched.ng-valid-required[ng-model="agg.params.orderBy"]'
        + `option:contains("${fieldValue}")`);
    }

    async selectOrderBy(fieldValue) {
      await find.clickByCssSelector(`select[name="orderBy"] > option[value="${fieldValue}"]`);
    }

    async getInputTypeParam(paramName) {
      const input = await find.byCssSelector(`input[ng-model="agg.params.${paramName}"]`);
      return await input.getProperty('value');
    }

    async getInterval() {
      const intervalElement = await find.byCssSelector(
        `select[ng-model="agg.params.interval"] option[selected]`);
      return await intervalElement.getProperty('label');
    }

    async setInterval(newValue) {
      log.debug(`Visualize.setInterval(${newValue})`);
      const input = await find.byCssSelector('select[ng-model="agg.params.interval"]');
      await input.type(newValue);
      // The interval element will only interpret space as "select this" if there
      // was a long enough gap from the typing above to the space click.  Hence the
      // need for the sleep.
      await PageObjects.common.sleep(500);
      await input.pressKeys(browser.keys.SPACE);
    }

    async setCustomInterval(newValue) {
      await this.setInterval('Custom');
      const input = await find.byCssSelector('input[name="customInterval"]');
      await input.clearValue();
      await input.type(newValue);
    }

    async setNumericInterval(newValue, { append } = {}) {
      const input = await find.byCssSelector('input[name="interval"]');
      if (!append) {
        await input.clearValue();
      }
      await input.type(newValue + '');
      await PageObjects.common.sleep(1000);
    }

    async setSize(newValue) {
      const input = await find.byCssSelector(`vis-editor-agg-params[aria-hidden="false"] input[name="size"]`);
      await input.clearValue();
      await input.type(String(newValue));
    }

    async toggleDisabledAgg(agg) {
      await testSubjects.click(`aggregationEditor${agg} disableAggregationBtn`);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async toggleAggregationEditor(agg) {
      await testSubjects.click(`aggregationEditor${agg} toggleEditor`);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async toggleOtherBucket() {
      return await find.clickByCssSelector('vis-editor-agg-params:not(.ng-hide) input[name="showOther"]');
    }

    async toggleMissingBucket() {
      return await find.clickByCssSelector('vis-editor-agg-params:not(.ng-hide) input[name="showMissing"]');
    }

    async isApplyEnabled() {
      const applyButton = await testSubjects.find('visualizeEditorRenderButton');
      return await applyButton.isEnabled();
    }

    async clickGo() {
      const prevRenderingCount = await this.getVisualizationRenderingCount();
      log.debug(`Before Rendering count ${prevRenderingCount}`);
      await testSubjects.clickWhenNotDisabled('visualizeEditorRenderButton');
      await this.waitForRenderingCount(prevRenderingCount + 1);
    }

    async clickReset() {
      await testSubjects.click('visualizeEditorResetButton');
      await this.waitForVisualization();
    }

    async toggleAutoMode() {
      await testSubjects.click('visualizeEditorAutoButton');
    }

    async sizeUpEditor() {
      await testSubjects.click('visualizeEditorResizer');
      await browser.pressKeys(browser.keys.ARROW_RIGHT);
    }

    async clickOptions() {
      await find.clickByPartialLinkText('Options');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async changeHeatmapColorNumbers(value = 6) {
      const input = await testSubjects.find(`heatmapOptionsColorsNumberInput`);
      await input.clearValue();
      await input.type(`${value}`);
    }

    async clickMetricsAndAxes() {
      await testSubjects.click('visEditorTabadvanced');
    }

    async clickOptionsTab() {
      await testSubjects.click('visEditorTaboptions');
    }

    async clickEnableCustomRanges() {
      await testSubjects.click('heatmapEnableCustomRanges');
    }

    async clickAddRange() {
      await testSubjects.click(`heatmapAddRangeButton`);
    }

    async isCustomRangeTableShown() {
      await testSubjects.exists('heatmapCustomRangesTable');
    }

    async addCustomRange(from, to) {
      const table = await testSubjects.find('heatmapCustomRangesTable');
      const lastRow = await table.findByCssSelector('tr:last-child');
      const fromCell = await lastRow.findByCssSelector('td:first-child input');
      await fromCell.clearValue();
      await fromCell.type(`${from}`);
      const toCell = await lastRow.findByCssSelector('td:nth-child(2) input');
      await toCell.clearValue();
      await toCell.type(`${to}`);
    }

    async clickYAxisOptions(axisId) {
      await testSubjects.click(`toggleYAxisOptions-${axisId}`);
    }

    async clickYAxisAdvancedOptions(axisId) {
      await testSubjects.click(`toggleYAxisAdvancedOptions-${axisId}`);
    }

    async changeYAxisFilterLabelsCheckbox(axisId, enabled) {
      const selector = `yAxisFilterLabelsCheckbox-${axisId}`;
      enabled ? await this.checkCheckbox(selector) : await this.uncheckCheckbox(selector);
    }

    async selectChartMode(mode) {
      const selector = await find.byCssSelector(`#seriesMode0 > option[label="${mode}"]`);
      await selector.click();
    }

    async selectYAxisScaleType(axisId, scaleType) {
      const selectElement = await testSubjects.find(`scaleSelectYAxis-${axisId}`);
      const selector = await selectElement.findByCssSelector(`option[label="${scaleType}"]`);
      await selector.click();
    }

    async clickData() {
      await testSubjects.click('visualizeEditDataLink');
    }

    async clickVisEditorTab(tabName) {
      await testSubjects.click('visEditorTab' + tabName);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async selectWMS() {
      await find.clickByCssSelector('input[name="wms.enabled"]');
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async ensureSavePanelOpen() {
      log.debug('ensureSavePanelOpen');
      await PageObjects.header.waitUntilLoadingHasFinished();
      const isOpen = await testSubjects.exists('savedObjectSaveModal', { timeout: 5000 });
      if (!isOpen) {
        await testSubjects.click('visualizeSaveButton');
      }
    }

    async saveVisualization(vizName, { saveAsNew = false } = {}) {
      await this.ensureSavePanelOpen();
      await testSubjects.setValue('savedObjectTitle', vizName);
      if (saveAsNew) {
        log.debug('Check save as new visualization');
        await testSubjects.click('saveAsNewCheckbox');
      }
      log.debug('Click Save Visualization button');
      await testSubjects.click('confirmSaveSavedObjectButton');
    }

    async saveVisualizationExpectSuccess(vizName, { saveAsNew = false } = {}) {
      await this.saveVisualization(vizName, { saveAsNew });
      const successToast = await testSubjects.exists('saveVisualizationSuccess', {
        timeout: defaultFindTimeout
      });
      expect(successToast).to.be(true);
    }

    async saveVisualizationExpectSuccessAndBreadcrumb(vizName, { saveAsNew = false } = {}) {
      await this.saveVisualizationExpectSuccess(vizName, { saveAsNew });
      await retry.waitFor('last breadcrumb to have new vis name', async () => (
        await globalNav.getLastBreadcrumb() === vizName
      ));
    }

    async saveVisualizationExpectFail(vizName, { saveAsNew = false } = {}) {
      await this.saveVisualization(vizName, { saveAsNew });
      const errorToast = await testSubjects.exists('saveVisualizationError', {
        timeout: defaultFindTimeout
      });
      expect(errorToast).to.be(true);
    }

    async clickLoadSavedVisButton() {
      // TODO: Use a test subject selector once we rewrite breadcrumbs to accept each breadcrumb
      // element as a child instead of building the breadcrumbs dynamically.
      await find.clickByCssSelector('[href="#/visualize"]');
    }

    async filterVisByName(vizName) {
      const input = await find.byCssSelector('input[name="filter"]');
      await input.click();
      // can't uses dashes in saved visualizations when filtering
      // or extended character sets
      // https://github.com/elastic/kibana/issues/6300
      await input.type(vizName.replace('-', ' '));
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickVisualizationByName(vizName) {
      log.debug('clickVisualizationByLinkText(' + vizName + ')');
      return find.clickByPartialLinkText(vizName);
    }

    async loadSavedVisualization(vizName, { navigateToVisualize = true } = {}) {
      if (navigateToVisualize) {
        await this.clickLoadSavedVisButton();
      }
      await this.openSavedVisualization(vizName);
    }

    async openSavedVisualization(vizName) {
      await this.clickVisualizationByName(vizName);
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async getXAxisLabels() {
      const chartTypes = await find.allByCssSelector('.x > g');
      async function getChartType(chart) {
        return await chart.getVisibleText();
      }
      const getChartTypesPromises = chartTypes.map(getChartType);
      return await Promise.all(getChartTypesPromises);
    }

    async getYAxisLabels() {
      const chartTypes = await find.allByCssSelector('.y > g');
      const getChartTypesPromises = chartTypes.map(async chart => await chart.getVisibleText());
      return await Promise.all(getChartTypesPromises);
    }

    /*
     ** This method gets the chart data and scales it based on chart height and label.
     ** Returns an array of height values
     */
    async getAreaChartData(dataLabel, axis = 'ValueAxis-1') {
      const yAxisRatio = await this.getChartYAxisRatio(axis);

      const rectangle = await find.byCssSelector('rect.background');
      const yAxisHeight = await rectangle.getAttribute('height');
      log.debug(`height --------- ${yAxisHeight}`);

      const path = await retry.try(
        async () => await find.byCssSelector(`path[data-label="${dataLabel}"]`, defaultFindTimeout * 2));
      const data = await path.getAttribute('d');
      log.debug(data);
      // This area chart data starts with a 'M'ove to a x,y location, followed
      // by a bunch of 'L'ines from that point to the next.  Those points are
      // the values we're going to use to calculate the data values we're testing.
      // So git rid of the one 'M' and split the rest on the 'L's.
      const tempArray = data.replace('M', '').split('L');
      const chartSections = tempArray.length / 2;
      // log.debug('chartSections = ' + chartSections + ' height = ' + yAxisHeight + ' yAxisLabel = ' + yAxisLabel);
      const chartData = [];
      for (let i = 0; i < chartSections; i++) {
        chartData[i] = Math.round((yAxisHeight - tempArray[i].split(',')[1]) * yAxisRatio);
        log.debug('chartData[i] =' + chartData[i]);
      }
      return chartData;
    }

    // The current test shows dots, not a line.  This function gets the dots and normalizes their height.
    async getLineChartData(dataLabel = 'Count', axis = 'ValueAxis-1') {
      // 1). get the range/pixel ratio
      const yAxisRatio = await this.getChartYAxisRatio(axis);
      // 2). find and save the y-axis pixel size (the chart height)
      const rectangle = await find.byCssSelector('clipPath rect');
      const yAxisHeight = await rectangle.getAttribute('height');
      // 3). get the visWrapper__chart elements
      const chartTypes = await retry.try(
        async () => await find
          .allByCssSelector(`.visWrapper__chart circle[data-label="${dataLabel}"][fill-opacity="1"]`, defaultFindTimeout * 2));

      // 5). for each chart element, find the green circle, then the cy position
      async function getChartType(chart) {
        const cy = await chart.getAttribute('cy');
        // the point_series_options test has data in the billions range and
        // getting 11 digits of precision with these calculations is very hard
        return Math.round(((yAxisHeight - cy) * yAxisRatio).toPrecision(6));
      }

      // 4). pass the chartTypes to the getChartType function
      const getChartTypesPromises = chartTypes.map(getChartType);
      return await Promise.all(getChartTypesPromises);
    }

    // this is ALMOST identical to DiscoverPage.getBarChartData
    async getBarChartData(dataLabel = 'Count', axis = 'ValueAxis-1') {
      // 1). get the range/pixel ratio
      const yAxisRatio = await this.getChartYAxisRatio(axis);
      // 3). get the visWrapper__chart elements
      const chartTypes = await find.allByCssSelector(`svg > g > g.series > rect[data-label="${dataLabel}"]`);
      log.debug(`chartTypes count = ${chartTypes.length}`);
      const chartData = await Promise.all(chartTypes.map(async chart => {
        const barHeight = await chart.getAttribute('height');
        return Math.round(barHeight * yAxisRatio);
      }));

      return chartData;
    }


    // Returns value per pixel
    async getChartYAxisRatio(axis = 'ValueAxis-1') {
      // 1). get the maximum chart Y-Axis marker value and Y position
      const maxYAxisChartMarker = await retry.try(
        async () => await find.byCssSelector(`div.visAxis__splitAxes--y > div > svg > g.${axis} > g:last-of-type.tick`)
      );
      const maxYLabel = (await maxYAxisChartMarker.getVisibleText()).replace(/,/g, '');
      const maxYLabelYPosition = (await maxYAxisChartMarker.getPosition()).y;
      log.debug(`maxYLabel = ${maxYLabel}, maxYLabelYPosition = ${maxYLabelYPosition}`);

      // 2). get the minimum chart Y-Axis marker value and Y position
      const minYAxisChartMarker = await find.byCssSelector(
        'div.visAxis__column--y.visAxis__column--left  > div > div > svg:nth-child(2) > g > g:nth-child(1).tick'
      );
      const minYLabel = (await minYAxisChartMarker.getVisibleText()).replace(',', '');
      const minYLabelYPosition = (await minYAxisChartMarker.getPosition()).y;
      return ((maxYLabel - minYLabel) / (minYLabelYPosition - maxYLabelYPosition));
    }


    async getHeatmapData() {
      const chartTypes = await retry.try(
        async () => await find.allByCssSelector('svg > g > g.series rect', defaultFindTimeout * 2));
      log.debug('rects=' + chartTypes);
      async function getChartType(chart) {
        return await chart.getAttribute('data-label');
      }
      const getChartTypesPromises = chartTypes.map(getChartType);
      return await Promise.all(getChartTypesPromises);
    }

    async expectError() {
      return await testSubjects.existOrFail('visLibVisualizeError');
    }

    async getChartAreaWidth() {
      const rect = await retry.try(async () => find.byCssSelector('clipPath rect'));
      return await rect.getAttribute('width');
    }

    async getChartAreaHeight() {
      const rect = await retry.try(async () => find.byCssSelector('clipPath rect'));
      return await rect.getAttribute('height');
    }

    /**
     * If you are writing new tests, you should rather look into getTableVisContent method instead.
     */
    async getTableVisData() {
      return await testSubjects.getVisibleText('paginated-table-body');
    }

    /**
     * This function is the newer function to retrieve data from within a table visualization.
     * It uses a better return format, than the old getTableVisData, by properly splitting
     * cell values into arrays. Please use this function for newer tests.
     */
    async getTableVisContent({ stripEmptyRows = true } = { }) {
      return await retry.try(async () => {
        const container = await testSubjects.find('tableVis');
        const allTables = await testSubjects.findAllDescendant('paginated-table-body', container);

        if (allTables.length === 0) {
          return [];
        }

        const allData = await Promise.all(allTables.map(async (t) => {
          let data = await table.getDataFromElement(t);
          if (stripEmptyRows) {
            data = data.filter(row => row.length > 0 && row.some(cell => cell.trim().length > 0));
          }
          return data;
        }));

        if (allTables.length === 1) {
        // If there was only one table we return only the data for that table
        // This prevents an unnecessary array around that single table, which
        // is the case we have in most tests.
          return allData[0];
        }

        return allData;
      });
    }

    async toggleIsFilteredByCollarCheckbox() {
      await testSubjects.click('isFilteredByCollarCheckbox');
    }

    async getMarkdownData() {
      const markdown = await retry.try(async () => find.byCssSelector('visualize'));
      return await markdown.getVisibleText();
    }

    async clickColumns() {
      await find.clickByCssSelector('div.schemaEditors > div > div > button:nth-child(2)');
    }

    async getVisualizationRenderingCount() {
      const visualizationLoader = await testSubjects.find('visualizationLoader');
      const renderingCount = await visualizationLoader.getAttribute('data-rendering-count');
      return Number(renderingCount);
    }

    async waitForRenderingCount(minimumCount = 1) {
      await retry.waitFor(`rendering count to be greater than or equal to [${minimumCount}]`, async () => {
        const currentRenderingCount = await this.getVisualizationRenderingCount();
        log.debug(`-- currentRenderingCount=${currentRenderingCount}`);
        return currentRenderingCount >= minimumCount;
      });
    }

    async waitForVisualizationRenderingStabilized() {
      //assuming rendering is done when data-rendering-count is constant within 1000 ms
      await retry.waitFor('rendering count to stabilize', async () => {
        const firstCount = await this.getVisualizationRenderingCount();
        log.debug(`-- firstCount=${firstCount}`);

        await PageObjects.common.sleep(1000);

        const secondCount = await this.getVisualizationRenderingCount();
        log.debug(`-- secondCount=${secondCount}`);

        return firstCount === secondCount;
      });
    }

    async waitForVisualization() {
      await this.waitForVisualizationRenderingStabilized();
      return await find.byCssSelector('.visualization');
    }

    async waitForVisualizationSavedToastGone() {
      return await testSubjects.waitForDeleted('saveVisualizationSuccess');
    }

    async getZoomSelectors(zoomSelector) {
      return await find.allByCssSelector(zoomSelector);
    }

    async clickMapButton(zoomSelector, waitForLoading) {
      await retry.try(async () => {
        const zooms = await this.getZoomSelectors(zoomSelector);
        await Promise.all(zooms.map(async zoom => await zoom.click()));
        if (waitForLoading) {
          await PageObjects.header.waitUntilLoadingHasFinished();
        }
      });
    }

    async getVisualizationRequest() {
      log.debug('getVisualizationRequest');
      await inspector.open();
      await testSubjects.click('inspectorViewChooser');
      await testSubjects.click('inspectorViewChooserRequests');
      await testSubjects.click('inspectorRequestDetailRequest');
      return await testSubjects.getVisibleText('inspectorRequestBody');
    }

    async getVisualizationResponse() {
      log.debug('getVisualizationResponse');
      await inspector.open();
      await testSubjects.click('inspectorViewChooser');
      await testSubjects.click('inspectorViewChooserRequests');
      await testSubjects.click('inspectorRequestDetailResponse');
      return await testSubjects.getVisibleText('inspectorResponseBody');
    }

    async getMapBounds() {
      const request = await this.getVisualizationRequest();
      const requestObject = JSON.parse(request);
      return requestObject.aggs.filter_agg.filter.geo_bounding_box['geo.coordinates'];
    }

    async clickMapZoomIn(waitForLoading = true) {
      await this.clickMapButton('a.leaflet-control-zoom-in', waitForLoading);
    }

    async clickMapZoomOut(waitForLoading = true) {
      await this.clickMapButton('a.leaflet-control-zoom-out', waitForLoading);
    }

    async getMapZoomEnabled(zoomSelector) {
      const zooms = await this.getZoomSelectors(zoomSelector);
      const classAttributes = await Promise.all(zooms.map(async zoom => await zoom.getAttribute('class')));
      return !classAttributes.join('').includes('leaflet-disabled');
    }

    async zoomAllTheWayOut() {
      // we can tell we're at level 1 because zoom out is disabled
      return await retry.try(async () => {
        await this.clickMapZoomOut();
        const enabled = await this.getMapZoomOutEnabled();
        //should be able to zoom more as current config has 0 as min level.
        if (enabled) {
          throw new Error('Not fully zoomed out yet');
        }
      });
    }

    async getMapZoomInEnabled() {
      return await this.getMapZoomEnabled('a.leaflet-control-zoom-in');
    }

    async getMapZoomOutEnabled() {
      return await this.getMapZoomEnabled('a.leaflet-control-zoom-out');
    }

    async clickMapFitDataBounds() {
      return await this.clickMapButton('a.fa-crop');
    }

    async clickLandingPageBreadcrumbLink() {
      log.debug('clickLandingPageBreadcrumbLink');
      await find.clickByCssSelector(`a[href="#${VisualizeConstants.LANDING_PAGE_PATH}"]`);
    }

    /**
     * Returns true if already on the landing page (that page doesn't have a link to itself).
     * @returns {Promise<boolean>}
     */
    async onLandingPage() {
      log.debug(`VisualizePage.onLandingPage`);
      const exists = await testSubjects.exists('visualizeLandingPage');
      return exists;
    }

    async gotoLandingPage() {
      log.debug('VisualizePage.gotoLandingPage');
      const onPage = await this.onLandingPage();
      if (!onPage) {
        await retry.try(async () => {
          await this.clickLandingPageBreadcrumbLink();
          const onLandingPage = await this.onLandingPage();
          if (!onLandingPage) throw new Error('Not on the landing page.');
        });
      }
    }

    async getLegendEntries() {
      const legendEntries = await find.allByCssSelector('.visLegend__valueTitle', defaultFindTimeout * 2);
      return await Promise.all(legendEntries.map(async chart => await chart.getAttribute('data-label')));
    }

    async openLegendOptionColors(name) {
      await this.waitForVisualizationRenderingStabilized();
      await retry.try(async () => {
        // This click has been flaky in opening the legend, hence the retry.  See
        // https://github.com/elastic/kibana/issues/17468
        await testSubjects.click(`legend-${name}`);
        await this.waitForVisualizationRenderingStabilized();
        // arbitrary color chosen, any available would do
        const isOpen = await this.doesLegendColorChoiceExist('#EF843C');
        if (!isOpen) {
          throw new Error('legend color selector not open');
        }
      });
    }

    async filterOnTableCell(column, row) {
      await retry.try(async () => {
        const table = await testSubjects.find('tableVis');
        const cell = await table.findByCssSelector(`tbody tr:nth-child(${row}) td:nth-child(${column})`);
        await browser.moveMouseTo(cell);
        const filterBtn = await testSubjects.findDescendant('filterForCellValue', cell);
        await filterBtn.click();
      });
    }

    async toggleLegend(show = true) {
      await retry.try(async () => {
        const isVisible = find.byCssSelector('vislib-legend');
        if ((show && !isVisible) || (!show && isVisible)) {
          await testSubjects.click('vislibToggleLegend');
        }
      });
    }

    async filterLegend(name) {
      await this.toggleLegend();
      await testSubjects.click(`legend-${name}`);
      await testSubjects.click(`legend-${name}-filterIn`);
      await this.waitForVisualizationRenderingStabilized();
    }

    async doesLegendColorChoiceExist(color) {
      return await testSubjects.exists(`legendSelectColor-${color}`);
    }

    async selectNewLegendColorChoice(color) {
      await testSubjects.click(`legendSelectColor-${color}`);
    }

    async doesSelectedLegendColorExist(color) {
      return await testSubjects.exists(`legendSelectedColor-${color}`);
    }

    async getYAxisTitle() {
      const title = await find.byCssSelector('.y-axis-div .y-axis-title text');
      return await title.getVisibleText();
    }

    async selectBucketType(type) {
      const bucketType = await find.byCssSelector(`[data-test-subj="${type}"]`);
      return await bucketType.click();
    }

    async getBucketErrorMessage() {
      const error = await find.byCssSelector('.visEditorAggParam__error');
      const errorMessage = await error.getProperty('innerText');
      log.debug(errorMessage);
      return errorMessage;
    }

    async selectSortMetric(agg, metric) {
      const sortMetric = await find.byCssSelector(`[data-test-subj="visEditorOrder${agg}-${metric}"]`);
      return await sortMetric.click();
    }

    async selectCustomSortMetric(agg, metric, field) {
      await this.selectSortMetric(agg, 'custom');
      await this.selectAggregation(metric, 'groupName');
      await this.selectField(field, 'groupName');
    }

    async clickSplitDirection(direction) {
      const activeParamPanel = await find.byCssSelector('vis-editor-agg-params[aria-hidden="false"]');
      const button = await testSubjects.findDescendant(`splitBy-${direction}`, activeParamPanel);
      await button.click();
    }

    async countNestedTables() {
      const vis = await testSubjects.find('tableVis');
      const result = [];

      for (let i = 1; true; i++) {
        const selector = new Array(i).fill('.kbnAggTable__group').join(' ');
        const tables = await vis.findAllByCssSelector(selector);
        if (tables.length === 0) {
          break;
        }
        result.push(tables.length);
      }

      return result;
    }

  }

  return new VisualizePage();
}
