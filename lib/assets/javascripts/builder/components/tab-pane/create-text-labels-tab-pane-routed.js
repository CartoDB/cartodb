var _ = require('underscore');
var CoreView = require('backbone/core-view');
var TabPaneViewRouted = require('./tab-pane-view-routed');
var TabPaneCollection = require('./tab-pane-collection');
var LabelView = require('./tab-pane-label-view');

/**
 * Creates a tab pane, where the menu consists of text labels.
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
      layerId: paneItem.layerId,
      label: paneItem.label,
      onClick: paneItem.onClick,
      selectedChild: paneItem.selectedChild,
      createButtonView: function () {
        return new LabelView(_.extend({ model: this }, tabPaneItemLabelOptions));
      },
      createContentView: function () {
        return paneItem.createContentView && paneItem.createContentView() || new CoreView();
      }
    };
  });

  var collection = new TabPaneCollection(items, options);

  var tabPaneOptions = options.tabPaneOptions;

  return new TabPaneViewRouted(
    _.extend(
      { collection: collection },
      tabPaneOptions
    )
  );
};
