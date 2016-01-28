var cdb = require('cartodb-deep-insights.js');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneCollection = require('./tab-pane-collection');
var LabelView = require('./tab-pane-label-view');
var IconView = require('./tab-pane-icon-view');
var _ = require('underscore');

/**
 *  TabPane Factory component
 */

module.exports = {
  /*
   * {
   *   label: 'My label',
   *   createContentView: cdb.core.View(),
   *   selected: false
   * }
   */
  createWithTextLabels: function (paneItems) {
    var items = _.map(paneItems, function (paneItem) {
      _.each(['label', 'createContentView'], function (check) {
        if (!paneItem[check]) {
          throw new Error(check + ' should be provided');
        }
      });

      return {
        selected: paneItem.selected,
        label: paneItem.label,
        createButtonView: function () {
          return new LabelView({ model: this });
        },
        createContentView: function () {
          return paneItem.createContentView && paneItem.createContentView() || new cdb.core.View();
        }
      };
    });

    var collection = new TabPaneCollection(items);

    return new TabPaneView({ collection: collection });
  },

  /*
   * {
   *   icon: 'my-icon',
   *   createContentView: cdb.core.View(),
   *   selected: false
   * }
   */
  createWithIcons: function (paneItems) {
    var items = _.map(paneItems, function (paneItem) {
      _.each(['icon', 'createContentView'], function (check) {
        if (!paneItem[check]) {
          throw new Error(check + ' should be provided');
        }
      });

      return {
        selected: paneItem.selected,
        icon: paneItem.icon,
        createButtonView: function () {
          return new IconView({ model: this });
        },
        createContentView: function () {
          return paneItem.createContentView && paneItem.createContentView() || new cdb.core.View();
        }
      };
    });

    var collection = new TabPaneCollection(items);

    return new TabPaneView({ collection: collection });
  }
};
