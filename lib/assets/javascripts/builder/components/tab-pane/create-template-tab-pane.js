var _ = require('underscore');
var cdb = require('internal-carto.js');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneCollection = require('./tab-pane-collection');
var TemplateView = require('./tab-pane-template-view');

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
  var tabPaneTemplateOptions = options.tabPaneTemplateOptions;

  var items = paneItems.map(function (paneItem) {
    ['label', 'name', 'createContentView'].forEach(function (check) {
      if (!paneItem[check]) {
        throw new Error(check + ' should be provided');
      }
    });

    return {
      name: paneItem.name,
      selected: paneItem.selected,
      label: paneItem.label,
      createButtonView: function () {
        return new TemplateView(_.extend({ model: this }, tabPaneTemplateOptions));
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
      {
        collection: collection,
        userModel: options.userModel
      },
      tabPaneOptions
    )
  );
};
