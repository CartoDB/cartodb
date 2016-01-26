var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var TabPaneItem = require('./tab-pane-item-view.js');
var Template = require('./tab-pane.tpl');
var TabPaneContent = require('./tab-pane-content-view.js');

/**
 *  TabPane component
 */

module.exports = cdb.core.View.extend({

  className: 'TabPane',

  initialize: function(options) {

    if (!this.collection) {
      throw new Error('A TabPaneCollection should be provided');
    }

    this.template = this.options.template || Template;

    this.collection.bind('change:selected', this._setSelected, this);
  },

  render: function() {

    this.$el.append(this.template());

    this._renderCollection();

    this._checkSelected();

    return this;
  },

  _setSelected: function(model, isSelected) {
    if (this._selectedView) {
      this._selectedView.clean();
      this.removeView(this._selectedView);
    }

    if (isSelected) {
      this._selectedView = this._renderTabPaneContentView(model);
    }
  },

  _checkSelected: function() {
    var model = this.collection.getSelected();

    if (model) {
      this._setSelected(model, true);
    }
  },

  _renderCollection() {
    this.collection.each(function(paneModel) {
      this._renderTabPaneItemView(paneModel);
    }, this);
  },

  _renderTabPaneItemView: function(model) {
    var tabPaneItemView = new TabPaneItem({ model: model });
    this.addView(tabPaneItemView);
    this.$('.js-menu').append(tabPaneItemView.render().$el);
  },

  _renderTabPaneContentView: function(model) {
    var tabPaneContentView = new TabPaneContent({ model: model });
    this.addView(tabPaneContentView);
    this.$('.js-content').append(tabPaneContentView.render().$el);

    return tabPaneContentView;
  }
});
