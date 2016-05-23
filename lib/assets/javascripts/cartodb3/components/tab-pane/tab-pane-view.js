var _ = require('underscore');
var cdb = require('cartodb.js');
var TabPaneItem = require('./tab-pane-item-view.js');
var Template = require('./tab-pane.tpl');

/**
 *  TabPane component
 */

module.exports = cdb.core.View.extend({
  className: 'Tab-pane',

  initialize: function (options) {
    if (!this.collection) {
      throw new Error('A TabPaneCollection should be provided');
    }

    this._tabPaneItemOptions = this.options.tabPaneItemOptions;
    this.template = this.options.template || Template;

    this.collection.bind('change:selected', this._renderSelected, this);
  },

  render: function () {
    this.$el.html(this.template(this.options));

    this._renderCollection();

    var model = this.getSelectedTabPane();

    if (model) {
      this._renderSelected(model, true);
    }

    return this;
  },

  getSelectedTabPane: function () {
    return this.collection.getSelected();
  },

  getTabPane: function (name) {
    return _.first(this.collection.where({ name: name }));
  },

  getSelectedTabPaneName: function () {
    var selectedTab = this.getSelectedTabPane();
    return selectedTab ? selectedTab.get('name') : null;
  },

  _renderSelected: function (model, isSelected) {
    if (isSelected) {
      if (this._selectedView) {
        this._selectedView.clean();
        this.removeView(this._selectedView);
      }

      this._selectedView = this._renderTabPaneContentView(model);
    }
  },

  _renderCollection: function () {
    this.collection.each(function (paneModel) {
      if (paneModel.get('createButtonView')) {
        this._renderTabPaneItemView(paneModel);
      }
    }, this);
  },

  _renderTabPaneItemView: function (model) {
    var tabPaneItemView = new TabPaneItem(_.extend({ model: model }, this._tabPaneItemOptions));
    this.addView(tabPaneItemView);
    this.$('.js-menu').append(tabPaneItemView.render().$el);
  },

  _renderTabPaneContentView: function (model) {
    var tabPaneContentView = model.get('createContentView').call(model);
    this.addView(tabPaneContentView);
    this.$('.js-content').append(tabPaneContentView.render().$el);

    return tabPaneContentView;
  }
});
