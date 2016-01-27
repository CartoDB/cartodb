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

    this.collection.bind('change:selected', this._renderSelected, this);
  },

  render: function() {

    this.$el.append(this.template());

    this._renderCollection();

    var model = this.collection.getSelected();

    if (model) {
      this._renderSelected(model, true);
    }

    return this;
  },

  _renderSelected: function(model, isSelected) {
    if (this._selectedView) {
      this._selectedView.clean();
      this.removeView(this._selectedView);
    }

    if (isSelected) {
      this._selectedView = this._renderTabPaneContentView(model);
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
