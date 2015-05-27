var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'keydown .js-url': '_update',
    'paste .js-url': '_update'
  },

  initialize: function() {
    this.elder('initialize');
    this._lastCallSeq = 0;
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/xyz/xyz')({
      })
    );

    return this;
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
    if (url) {
      try {
        layer = cdb.admin.TileLayer.byCustomURL(url);
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

  _disableOkBtn: function(disable) {
    this.$('.ok')[ disable ? 'addClass' : 'removeClass' ]('is-disabled');
  },

  _updateError: function(msg) {
    this.$('.js-error').text(msg)[ msg ? 'addClass' : 'removeClass' ]('is-visible');
  },

  _indicateIsValidating: function(indicate) {
    if (indicate) {
      this.$('.js-idle').hide();
      this.$('.js-validating').show();
    } else {
      this.$('.js-validating').hide();
      this.$('.js-idle').show();
    }
  }
});
