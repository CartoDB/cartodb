var cdb = require('cartodb.js');

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
    this.model.set('url', this.$('.js-url').val());
    this.$('.ok')[ this.model.get('url') ? 'removeClass' : 'addClass' ]('is-disabled');
  }, 100)
});
