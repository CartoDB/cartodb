var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  className: 'XYZPanel',

  events: {
    'click .js-tms': '_setTMS',
    'keydown .js-url': '_update',
    'paste .js-url': '_update'
  },

  initialize: function() {
    this.elder('initialize');
    this._lastCallSeq = 0;
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/xyz')()
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

  _update: function(ev) {
    ev.stopPropagation();
    this._debouncedUpdate();
  },

  _debouncedUpdate: _.debounce(function() {
    this._disableOkBtn(true);
    this._indicateIsValidating(true);
    var layer;
    var urlErrorMsg;

    var url = this.$('.js-url').val();
    var tms = this.$('.js-tms .Checkbox-input').hasClass('is-checked');

    if (url) {
      if (_.any(this.model.get('baseLayers').custom(), function(customLayer) { return customLayer.get('urlTemplate') === url })) {
        urlErrorMsg = 'You have already added this basemap';
      } else {
        try {
          layer = cdb.admin.TileLayer.byCustomURL(url, tms);
        } catch (e) {
          urlErrorMsg = 'It does not look like a valid XYZ URL';
        }
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
            self._updateError("We couldn't validate this, if you're sure it contains data click \"set basemap\"");
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
