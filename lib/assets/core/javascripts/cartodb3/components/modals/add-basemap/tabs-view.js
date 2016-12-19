var CoreView = require('backbone/core-view');
var $ = require('jquery');
var template = require('./tabs.tpl');

/**
 * View representing the tabs content of the dialog.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-tabs button': '_onClickTab'
  },

  attributes: function () {
    return {
      class: 'Modal-outer'
    };
  },

  initialize: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      model: this.model
    }));
    this.$('.js-tab-content').append(this._createTabContentView().el);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:currentTab', this.render, this);
  },

  _createTabContentView: function () {
    if (this._currentTabView) {
      this._currentTabView.clean();
    }
    this._currentTabView = this.model.activeTabModel().createView({
      submitButton: this._submitButton,
      modalFooter: this._modalFooter
    });
    this.addView(this._currentTabView);
    return this._currentTabView.render();
  },

  _onClickTab: function (e) {
    this.killEvent(e);
    var name = $(e.target).closest('button').data('name');
    if (name) {
      this.model.set('currentTab', name);
    } else {
      throw new Error('tab name was expected but was empty');
    }
  }

});
