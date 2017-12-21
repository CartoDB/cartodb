var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./enter-url.tpl');

/**
 * Represents the TileJSON tab content.
 */
module.exports = CoreView.extend({

  events: {
    'keydown .js-url': '_onKeydown',
    'paste .js-url': '_onPaste'
  },

  initialize: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.tileJSONLayerModel) throw new Error('tileJSONLayerModel is required');

    this._submitButton = opts.submitButton;
    this._tileJSONLayerModel = opts.tileJSONLayerModel;
    this._lastURL = '';
    this._debouncedUpdate = _.debounce(this._update.bind(this), 150);
  },

  render: function () {
    this._updateOkBtn();
    this._disableOkBtn(true);

    this.$el.html(
      template()
    );

    return this;
  },

  _onKeydown: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _onPaste: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _update: function () {
    var self = this;

    this._disableOkBtn(true);
    this._indicateIsValidating(true);

    var url = this._urlWithHTTP();

    if (url === this._lastURL) {
      // Even if triggered nothing really changed so just update UI and return early
      this._indicateIsValidating(false);
      this._updateError();

      return;
    }

    this._lastURL = url;

    this._indicateIsValidating(true);

    this._tileJSONLayerModel.setUrl(url);

    this._tileJSONLayerModel.fetch({
      success: function (mdl) {
        if (url === self._lastURL) {
          self.model.set('layer', mdl.newTileLayer());
          self._disableOkBtn(false);
          self._indicateIsValidating(false);
          self._updateError();
        }
      },
      error: function () {
        if (url === self._lastURL) {
          self._indicateIsValidating(false);
          // Note that this text can not be longer, or it will exceed available space of the error label.
          self._updateError(_t('components.modals.add-basemap.tilejson.invalid'));
        }
      }
    });
  },

  _updateOkBtn: function () {
    this._submitButton.find('span').text(_t('components.modals.add-basemap.add-btn'));
  },

  _disableOkBtn: function (disable) {
    this._submitButton.toggleClass('is-disabled', disable);
  },

  _updateError: function (msg) {
    this.$('.js-error').text(msg)[msg ? 'addClass' : 'removeClass']('is-visible');
  },

  _indicateIsValidating: function (indicate) {
    if (indicate) {
      this.$('.js-idle').hide();
      this.$('.js-validating').show();
    } else {
      this.$('.js-validating').hide();
      this.$('.js-idle').show();
    }
  },

  // So don't try to be fetched relatively to current URL path later
  _urlWithHTTP: function () {
    var str = this.$('.js-url').val();

    if (str.indexOf('http://') === -1 && str.indexOf('https://') === -1) {
      return 'http://' + str;
    } else {
      return str;
    }
  }

});
