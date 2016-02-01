var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

/**
 * Represents the TileJSON tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'keydown .js-url': '_update',
    'paste .js-url': '_update'
  },

  initialize: function() {
    this.elder('initialize');
    this._lastURL = '';
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/tile_json/tile_json')({
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

    var url = this._urlWithHTTP();
    if (url === this._lastURL) {
      // Even if triggered nothing really changed so just update UI and return early
      this._indicateIsValidating(false);
      this._updateError();
      return;
    }

    this._lastURL = url;
    this._indicateIsValidating(true);
    var tileJSON = new cdb.admin.TileJSON({
      url: url
    });

    var self = this;
    tileJSON.fetch({
      success: function() {
        if (url === self._lastURL) {
          self.model.set('layer', tileJSON.newTileLayer());
          self._disableOkBtn(false);
          self._indicateIsValidating(false);
          self._updateError();
        }
      },
      error: function() {
        if (url === self._lastURL) {
          self._indicateIsValidating(false);
          // Note that this text can not be longer, or it will exceed available space of the error label.
          self._updateError('Invalid URL, please make sure it is correct');
        }
      }
    });
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
  },

  // So don't try to be fetched relatively to current URL path later
  _urlWithHTTP: function() {
    var str = this.$('.js-url').val();
    if (str.indexOf('http://') === -1) {
      return 'http://' + str;
    } else {
      return str;
    }
  }
});
