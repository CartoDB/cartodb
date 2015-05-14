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
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/xyz')({
      })
    );

    return this;
  },

  _update: function(ev) {
    ev.stopPropagation();
    this._debouncedUpdate();
  },

  _debouncedUpdate: _.debounce(function() {
    var layer;
    var disableOkBtn = true;
    var errorMsg;

    var url = this.$('.js-url').val();
    if (url) {
      try {
        layer = cdb.admin.TileLayer.byCustomURL(url);
        disableOkBtn = false;
      } catch (e) {
        errorMsg = 'It does not look like a valid XYZ URL';
      }
    }

    this.model.set('layer', layer);
    this._disableOkBtn(disableOkBtn);
    this._updateError(errorMsg);
  }, 150),

  _disableOkBtn: function(disable) {
    this.$('.ok')[ disable ? 'addClass' : 'removeClass' ]('is-disabled');
  },

  _updateError: function(msg) {
    this.$('.js-error').text(msg)[ msg ? 'addClass' : 'removeClass' ]('is-visible');
  }
});
