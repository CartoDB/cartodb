var Backbone = require('backbone');

/**
 *  Edit vis metadata dialog model
 *  to control if name and metadata
 *  are editable or not.
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    name: ''
  },

  validate: function (attrs) {
    if (!attrs) return;
    if (!attrs.name) {
      return _t('components.modals.maps-metadata.validation.error.name');
    }
  }
});
