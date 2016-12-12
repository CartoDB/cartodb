var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  className: 'XYZPanel',

  events: {
    'click .js-tms': '_changeTMS',
    'keydown .js-url': '_update',
    'paste .js-url': '_update'
  },

  initialize: function() {
    this.elder('initialize');
    this._lastCallSeq = 0;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/xyz/xyz')({
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Add TMS tooltip
    var tooltip = new cdb.common.TipsyTooltip({
      el: this.$('.js-tms'),
      title: function() {
        return $(this).data('title')
      }
    })
    this.addView(tooltip);
  },

  _initBinds: function() {
    this.model.bind('change:tms', this._setTMSCheckbox, this);
  },

  _update: function(ev) {
    ev.stopPropagation();
    this._debouncedUpdate();
  },

  _changeTMS: function(ev) {
    this.model.set('tms', !this.model.get('tms'));
    this._update(ev);
  },

  _setTMSCheckbox: function(e) {
    this.$('.js-tms .Checkbox-input')[ this.model.get('tms') ? 'addClass' : 'removeClass' ]('is-checked');
  },

  _debouncedUpdate: _.debounce(function() {
    this._disableOkBtn(true);
    this._indicateIsValidating(true);
    var layer;
    var urlErrorMsg;

    var url = this.$('.js-url').val();
    var tms = this.model.get('tms');

    if (url) {
      try {
        layer = cdb.admin.TileLayer.byCustomURL(url, tms);
      } catch (e) {
        urlErrorMsg = 'It does not look like a valid XYZ URL';
      }
    }

    this.model.set('layer', layer);
    if (layer) {
      var self = this;
      // Make sure only the last call made is the one that defines view change,
      // avoids laggy responses to indicate wrong state
      var thisCallSeq = ++this._lastCallSeq;
      layer.validateTemplateURL({
        success: function() {
          if (thisCallSeq === self._lastCallSeq) {
            self._disableOkBtn(false);
            self._indicateIsValidating(false);
            self._updateError();
          }
        },
        error: function() {
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

  _setTMS: function(ev) {
    var $checkbox = $(ev.target).closest('.Checkbox');
    $checkbox.find('.Checkbox-input').toggleClass('is-checked');
    this._update(ev);
  },

  _disableOkBtn: function(disable) {
    this.$('.ok')[ disable ? 'addClass' : 'removeClass' ]('is-disabled');
  },

  _updateError: function(msg) {
    this.$('.js-error').text(msg)[ msg ? 'addClass' : 'removeClass' ]('is-visible');
  },

  _indicateIsValidating: function(indicate) {
    if (indicate) {
      this.$('.js-validating').show();
    } else {
      this.$('.js-validating').hide();
    }
  }
});
