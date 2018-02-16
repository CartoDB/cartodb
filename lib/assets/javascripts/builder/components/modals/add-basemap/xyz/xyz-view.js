var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./enter-url.tpl');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

/**
 * Represents the XYZ tab content.
 */

module.exports = CoreView.extend({

  className: 'XYZPanel',

  events: {
    'click .js-tms': '_changeTMS',
    'keydown .js-url': '_onKeydown',
    'paste .js-url': '_onPaste'
  },

  initialize: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');

    this._submitButton = opts.submitButton;
    this._lastCallSeq = 0;
    this._debouncedUpdate = _.debounce(this._update.bind(this), 150);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._updateOkBtn();
    this._disableOkBtn(true);

    this.$el.html(
      template()
    );

    this._initViews();

    return this;
  },

  _initViews: function () {
    // Add TMS tooltip
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-tms'),
      title: function () {
        return $(this).data('title');
      }
    });
    this.addView(tooltip);
  },

  _onKeydown: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _onPaste: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _initBinds: function () {
    this.model.bind('change:tms', this._setTMSCheckbox, this);
  },

  _update: function () {
    this._disableOkBtn(true);
    this._indicateIsValidating(true);
    var layer;
    var urlErrorMsg;

    var url = this.$('.js-url').val();
    var tms = this.model.get('tms');

    if (url) {
      try {
        layer = this._byCustomURL(url, tms);
      } catch (e) {
        urlErrorMsg = _t('components.modals.add-basemap.xyz.not-valid');
      }
    }

    this.model.set('layer', layer);

    if (layer) {
      var self = this;
      // Make sure only the last call made is the one that defines view change,
      // avoids laggy responses to indicate wrong state
      var thisCallSeq = ++this._lastCallSeq;
      layer.validateTemplateURL({
        success: function () {
          if (thisCallSeq === self._lastCallSeq) {
            self._disableOkBtn(false);
            self._indicateIsValidating(false);
            self._updateError();
          }
        },
        error: function () {
          if (thisCallSeq === self._lastCallSeq) {
            self._disableOkBtn(false);
            self._indicateIsValidating(false);
            self._updateError(_t('components.modals.add-basemap.xyz.couldnt-validate'));
          }
        }
      });
    } else if (url) {
      this._indicateIsValidating(false);
      this._updateError(urlErrorMsg);
    } else {
      this._indicateIsValidating(false);
      this._updateError();
    }
  },

  _changeTMS: function (e) {
    this.model.set('tms', !this.model.get('tms'));
    this._onKeydown(e);
  },

  _setTMSCheckbox: function (e) {
    this.$('.js-tms .Checkbox-input').toggleClass('is-checked', this.model.get('tms'));
  },

  _byCustomURL: function (url, tms) {
    // Minimal test for "valid URL" w/o having to complicate it with regex
    if (url && url.indexOf('/') === -1) throw new TypeError('invalid URL');

    // Only lowercase the placeholder variables, since the URL may contain case-sensitive data (e.g. API keys and such)
    url = url.replace(/\{S\}/g, '{s}')
      .replace(/\{X\}/g, '{x}')
      .replace(/\{Y\}/g, '{y}')
      .replace(/\{Z\}/g, '{z}');

    var layer = new CustomBaselayerModel({
      urlTemplate: url,
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      name: '',
      tms: tms,
      category: 'Custom',
      type: 'Tiled'
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  },

  _setTMS: function (ev) {
    var $checkbox = $(ev.target).closest('.Checkbox');
    $checkbox.find('.Checkbox-input').toggleClass('is-checked');
    this._update(ev);
  },

  _updateOkBtn: function () {
    this._submitButton.find('span').text(_t('components.modals.add-basemap.add-btn'));
  },

  _disableOkBtn: function (disable) {
    this._submitButton.toggleClass('is-disabled', disable);
  },

  _updateError: function (msg) {
    this.$('.js-error').text(msg)[ msg ? 'addClass' : 'removeClass' ]('is-visible');
  },

  _indicateIsValidating: function (indicate) {
    this.$('.js-validating').toggle(!!indicate);
  }

});
