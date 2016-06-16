var CoreView = require('backbone/core-view');
var template = require('./xyz.tpl');
var _ = require('underscore');
var CustomLayer = require('./custom-layer-model');

/**
 * Represents the XYZ tab content.
 */

module.exports = CoreView.extend({

  className: 'XYZPanel',

  events: {
    'click .js-tms': '_changeTMS',
    'keydown .js-url': '_update',
    'paste .js-url': '_update',
    'click .js-ok': '_ok'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userLayersCollection = opts.userLayersCollection;

    this._lastCallSeq = 0;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
      })
    );
    // this._initViews();
    return this;
  },

  // _initViews: function() {
  //   // Add TMS tooltip
  //   var tooltip = new cdb.common.TipsyTooltip({
  //     el: this.$('.js-tms'),
  //     title: function() {
  //       return $(this).data('title')
  //     }
  //   })
  //   this.addView(tooltip);
  // },

  _initBinds: function () {
    this.model.bind('change:tms', this._setTMSCheckbox, this);
  },

  _update: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _changeTMS: function (e) {
    this.model.set('tms', !this.model.get('tms'));
    this._update(e);
  },

  _setTMSCheckbox: function (e) {
    this.$('.js-tms .Checkbox-input')[ this.model.get('tms') ? 'addClass' : 'removeClass' ]('is-checked');
  },

  _byCustomURL: function (url, tms) {
    // Minimal test for "valid URL" w/o having to complicate it with regex
    if (url && url.indexOf('/') === -1) throw new TypeError('invalid URL');

    // Only lowercase the placeholder variables, since the URL may contain case-sensitive data (e.g. API keys and such)
    url = url.replace(/\{S\}/g, '{s}')
      .replace(/\{X\}/g, '{x}')
      .replace(/\{Y\}/g, '{y}')
      .replace(/\{Z\}/g, '{z}');

    var layer = {
      urlTemplate: url,
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      name: 'Custom basemap',
      tms: tms,
      type: 'Tiled'
    };

    return layer;
  },

  _validateTemplateURL: function (attrs, callbacks) {
    var subdomains = ['a', 'b', 'c'];
    var image = new Image();
    image.onload = callbacks.success;
    image.onerror = callbacks.error;

    image.src = attrs.urlTemplate.replace(/\{s\}/g, function () {
      return subdomains[Math.floor(Math.random() * 3)];
    })
      .replace(/\{x\}/g, '0')
      .replace(/\{y\}/g, '0')
      .replace(/\{z\}/g, '0');
  },

  _debouncedUpdate: _.debounce(function () {
    this._disableOkBtn(true);
    this._indicateIsValidating(true);
    var layerAttrs;
    var urlErrorMsg;

    var url = this.$('.js-url').val();
    var tms = this.model.get('tms');

    if (url) {
      try {
        layerAttrs = this._byCustomURL(url, tms);
      } catch (e) {
        urlErrorMsg = 'It does not look like a valid XYZ URL';
      }
    }

    this.model.set('layer', layerAttrs);

    if (layerAttrs) {
      var self = this;
      // Make sure only the last call made is the one that defines view change,
      // avoids laggy responses to indicate wrong state
      var thisCallSeq = ++this._lastCallSeq;
      this._validateTemplateURL(layerAttrs, {
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
            // Note that this text can not be longer, or it will exceed available space of the error label.
            self._updateError("We couldn't validate this, if you're sure it contains data click \"add basemap\"");
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
  }, 150),

  // _setTMS: function(ev) {
  //   var $checkbox = $(ev.target).closest('.Checkbox');
  //   $checkbox.find('.Checkbox-input').toggleClass('is-checked');
  //   this._update(ev);
  // },

  _disableOkBtn: function (disable) {
    this.$('.ok')[ disable ? 'addClass' : 'removeClass' ]('is-disabled');
  },

  _updateError: function (msg) {
    this.$('.js-error').text(msg)[ msg ? 'addClass' : 'removeClass' ]('is-visible');
  },

  _indicateIsValidating: function (indicate) {
    if (indicate) {
      this.$('.js-validating').show();
    } else {
      this.$('.js-validating').hide();
    }
  },

  _saveBasemap: function () {
    var layerAttrs = this.model.get('layer');
    var layer = new CustomLayer(layerAttrs);

    // Add to userLayers collection before saving, so save URL resolves to the expected endpoint
    this._userLayersCollection.add(layer);
    layer.save();

    // Update baseLayer
    this._layerDefinitionsCollection.setBaseLayer(layerAttrs);
  },

  _ok: function () {
    this._saveBasemap();
  }

});
