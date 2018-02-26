var CoreView = require('backbone/core-view');
var ViewFactory = require('builder/components/view-factory');
var renderLoading = require('builder/components/loading/render-loading');
var enterUrl = require('./enter-url.tpl');

/**
 * Represents the Mapbox tab content.
 */

module.exports = CoreView.extend({

  events: {
    'keydown': '_onKeyDown',
    'keyup': '_onKeyUp'
  },

  initialize: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;
    this._onClickBinded = this._onClickOK.bind(this);

    this._bindSubmitButton();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var view;

    switch (this.model.get('currentView')) {
      case 'validatingInputs':
        this._disableModalFooter(true);

        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.validating')
          })
        );
        break;
      case 'enterURL':
      default:
        this._disableModalFooter(false);

        view = ViewFactory.createByHTML(
          enterUrl({
            url: this.model.get('url'),
            lastErrorMsg: this.model.get('lastErrorMsg')
          })
        );
    }
    this.addView(view);
    this.$el.append(view.render().el);

    this._updateOkBtn();
    this._onKeyUp();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _hasValues: function () {
    return this._urlVal();
  },

  _urlVal: function () {
    return this.$('.js-url').val();
  },

  _onClickOK: function (e) {
    this.killEvent(e);

    if (this._hasValues()) {
      var url = this._urlVal();

      this.model.validateInputs(url);
    }
  },

  _disableModalFooter: function (disable) {
    this._modalFooter.toggleClass('is-disabled', disable);
  },

  _updateOkBtn: function () {
    this._submitButton.find('span').text(_t('components.modals.add-basemap.add-btn'));
  },

  _onKeyDown: function (e) {
    e.stopPropagation();

    this.$('.js-error').removeClass('is-visible');
  },

  _onKeyUp: function (e) {
    e && e.stopPropagation();
    this._submitButton.toggleClass('is-disabled', !this._hasValues());
  },

  _bindSubmitButton: function () {
    this._submitButton.on('click', this._onClickBinded);
  },

  _unBindSubmitButton: function () {
    this._submitButton.off('click', this._onClickBinded);
  },

  clean: function () {
    this._unBindSubmitButton();
    CoreView.prototype.clean.call(this);
  }

});
