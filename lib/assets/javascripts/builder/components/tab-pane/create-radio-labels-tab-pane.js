var _ = require('underscore');
var CoreView = require('backbone/core-view');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneCollection = require('./tab-pane-collection');
var RadioLabelView = require('./tab-pane-radio-label-view');

/**
 * Creates a tab pane, where the menu consists of radio inputs with labels.
 *
 * Example usage:
 * {
 *   label: 'My label',
 *   createContentView: CoreView(),
 *   selected: false
 * }
 *
 * @param {Array} paneItems
 * @param {Object} options
 * @return {Object} instance of CoreView
 */
module.exports = function (paneItems, options) {
  options = options || {};
  var tabPaneItemLabelOptions = options.tabPaneItemLabelOptions;

  var items = paneItems.map(function (paneItem) {
    ['label', 'createContentView'].forEach(function (check) {
      if (!paneItem[check]) {
        throw new Error(check + ' should be provided');
      }
    });

    return {
      name: paneItem.name,
      selected: paneItem.selected,
      disabled: paneItem.disabled,
      tooltip: paneItem.tooltip,
      tooltipGravity: paneItem.tooltipGravity,
      label: paneItem.label,
      selectedChild: paneItem.selectedChild,
      createButtonView: function () {
        return new RadioLabelView(_.extend({ model: this }, tabPaneItemLabelOptions));
      },
      createContentView: function () {
        return paneItem.createContentView && paneItem.createContentView() || new CoreView();
      }
    };
  });

  var collection = new TabPaneCollection(items);

  var tabPaneOptions = options.tabPaneOptions;

  return new TabPaneView(
    _.extend(
      { collection: collection },
      tabPaneOptions
    )
  );
};
