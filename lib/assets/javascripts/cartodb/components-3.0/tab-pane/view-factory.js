var cdb = require('cartodb.js');
var Backbone = require('backbone');
var TabPaneView = require('./view.js');
var TabPaneCollection = require('./collection');
var LabelView = require('./../label/view');
var IconView = require('./../icon/view');

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
  createWithTextLabels: function(paneItems) {

    var items = _.map(paneItems, function(paneItem) {
      _.each(['label', 'createContentView'], function(check) {
        if (!paneItem[check]) {
          throw new Error(check + ' should be provided');
        }
      });

      return {
        selected: paneItem.selected,
        createButtonView: function() {
          return new LabelView({ title: paneItem.label });
        },
        createContentView: function() {
          return paneItem.createContentView();
        }
      }
    }, this);

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
  createWithIcons: function(paneItems) {

    var items = _.map(paneItems, function(paneItem) {
      _.each(['icon', 'createContentView'], function(check) {
        if (!paneItem[check]) {
          throw new Error(check + ' should be provided');
        }
      });

      return {
        selected: paneItem.selected,
        createButtonView: function() {
          return new IconView({ name: paneItem.icon });
        },
        createContentView: function() {
          return paneItem.createContentView();
        }
      }
    }, this);

    var collection = new TabPaneCollection(items);

    return new TabPaneView({ collection: collection });

  }
};
