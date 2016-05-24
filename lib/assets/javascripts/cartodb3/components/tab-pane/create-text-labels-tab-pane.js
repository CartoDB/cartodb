var _ = require('underscore');
var cdb = require('cartodb.js');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneCollection = require('./tab-pane-collection');
var LabelView = require('./tab-pane-label-view');

/**
 * Creates a tab pane, where the menu consists of text labels.
 *
 * Example usage:
 * {
 *   label: 'My label',
 *   createContentView: cdb.core.View(),
 *   selected: false
 * }
 *
 * @param {Array} paneItems
 * @param {Object} options
 * @return {Object} instance of cdb.core.View
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
      label: paneItem.label,
      createButtonView: function () {
        return new LabelView(_.extend({ model: this }, tabPaneItemLabelOptions));
      },
      createContentView: function () {
        return paneItem.createContentView && paneItem.createContentView() || new cdb.core.View();
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
