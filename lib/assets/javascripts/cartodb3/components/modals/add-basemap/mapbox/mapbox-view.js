var CoreView = require('backbone/core-view');
var ViewFactory = require('../../../view-factory');
var renderLoading = require('../../../loading/render-loading');
var enterUrl = require('./enter-url.tpl');

/**
 * Represents the Mapbox tab content.
 */

module.exports = CoreView.extend({

  events: {
    'click .js-ok': '_onClickOK',
    'keydown': '_onKeyDown',
    'keyup': '_onKeyUp'
  },

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var view;

    switch (this.model.get('currentView')) {
      case 'validatingInputs':
        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.validating')
          })
        );
        break;
      case 'enterURL':
      default:
        view = ViewFactory.createByHTML(
          enterUrl({
            url: this.model.get('url'),
            accessToken: this.model.get('accessToken'),
            lastErrorMsg: this.model.get('lastErrorMsg')
          })
        );
    }
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _hasValues: function () {
    return this._urlVal() && this._accessToken();
  },

  _urlVal: function () {
    return this.$('.js-url').val();
  },

  _accessToken: function () {
    return this.$('.js-access-token').val();
  },

  _onClickOK: function (e) {
    this.killEvent(e);

    if (this._hasValues()) {
      var url = this._urlVal();
      var accessToken = this._accessToken();

      this.model.validateInputs(url, accessToken);
    }
  },

  _onKeyDown: function (e) {
    e.stopPropagation();

    this.$('.js-error').removeClass('is-visible');
  },

  _onKeyUp: function (e) {
    e.stopPropagation();

    this.$('.js-ok').toggleClass('is-disabled', !this._hasValues());
  }

});
