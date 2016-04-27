var _ = require('underscore');
var cdb = require('cartodb.js');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneCollection = require('./tab-pane-collection');
var IconView = require('./tab-pane-icon-view');

/**
 * Creates a tab pane representing editor's left-vertical menu, where the tab items are large icons,
 * and the content on the right.
 *
 * Example usage:
 * {
 *   icon: 'my-icon',
 *   createContentView: cdb.core.View(),
 *   selected: false
 * }
 * @param {Array} paneItems
 * @param {Object} options
 * @return {Object} instance of a Backbone view
 */
module.exports = function (paneItems, options) {
  options = options || {};
  var tabPaneItemIconOptions = options.tabPaneItemIconOptions;

  var items = paneItems.map(function (paneItem) {
    ['icon', 'createContentView'].forEach(function (check) {
      if (!paneItem[check]) {
        throw new Error(check + ' should be provided');
      }
    });

    return {
      selected: paneItem.selected,
      icon: paneItem.icon,
      createButtonView: function () {
        return new IconView(_.extend({ model: this }, tabPaneItemIconOptions));
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
