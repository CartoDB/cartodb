var _ = require('underscore');
var CoreView = require('backbone/core-view');
var TabPaneItem = require('./tab-pane-item-view.js');
var Template = require('./tab-pane.tpl');

/**
 *  TabPane component
 */

module.exports = CoreView.extend({
  className: 'Tab-pane',

  events: {
    'mouseover': '_onMouseOver'
  },

  initialize: function (options) {
    if (!this.collection) {
      throw new Error('A TabPaneCollection should be provided');
    }

    this._userModel = options.userModel;
    this._tabPaneItemOptions = this.options.tabPaneItemOptions;
    this._createContentKey = this.options.createContentKey || 'createContentView';
    this.template = this.options.template || Template;

    if (this.options.mouseOverAction) {
      this._mouseOverAction = this.options.mouseOverAction;
    }

    this.collection.bind('change:selected', this._renderSelected, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.html(this.template(this.options));

    this._renderCollection();

    var model = this.getSelectedTabPane();

    if (model) {
      this._renderSelected(model, true);
    }

    return this;
  },

  getTabPaneCollection: function () {
    return this.collection;
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

  setSelectedTabPaneByName: function (name) {
    return this.collection.select('name', name);
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
    this.$('.js-menu').append(tabPaneItemView.render().el);
  },

  _renderTabPaneContentView: function (model) {
    var tabPaneContentView = model.get(this._createContentKey).call(model);
    if (tabPaneContentView) {
      this.addView(tabPaneContentView);
      this.$('.js-content').append(tabPaneContentView.render().el);
      if (typeof tabPaneContentView.afterRender === 'function') {
        tabPaneContentView.afterRender();
      }
    }
    return tabPaneContentView;
  },

  changeStyleMenu: function (m) {
    this.$('.js-theme').toggleClass('is-dark', m.isEditing());
  },

  _onMouseOver: function () {
    this._mouseOverAction && this._mouseOverAction();
  }
});
