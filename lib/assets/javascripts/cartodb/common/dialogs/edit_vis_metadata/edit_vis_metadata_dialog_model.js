var cdb = require('cartodb.js');

/**
 *  Edit vis metadata dialog model
 *  to control if name and metadata
 *  are editable or not.
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    name: '',
    description: '',
    tags: '',
    privacy: ''
  },

  initialize: function(attrs, opts) {
    if (!opts || !opts.vis || !opts.user || !opts.dataLayer) {
      throw new Error('Visualization, user and dataLayer models are necessary');
    }
    this.vis = opts.vis;
    this.user = opts.user;
    this.dataLayer = opts.dataLayer

    // Validation control variable
    this.validationError = '';
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('valid', function() {
      this.validationError = '';
    }, this);
    this.bind('error', function(m, error) {
      this.validationError = error;
    }, this);
  },

  // Validation

  _validate: function(attrs, options) {
    var valid = cdb.core.Model.prototype._validate.apply(this, arguments);
    if (valid) {
      this.trigger('valid')
      return true;
    } else {
      return false;
    }
  },

  validate: function(attrs) {
    if (!attrs) return;

    if (!attrs.name) {
      return "Name can't be blank" 
    }
  },

  getError: function() {
    return this.validationError;
  },

  isValid: function() {
    if (!this.validate) {
      return true;
    }
    return !this.validate(this.attributes) && this.validationError === "";
  },

  // Helper functions

  getVisType: function() {
    return this.vis.isVisualization() ? 'map' : 'dataset';
  },

  isVisEditable: function() {
    if (this.vis.permission.isOwner(this.user)) {
      return true
    } else {
      return false
    }
  },

  isNameEditable: function() {
    if (this.vis.isVisualization()) {
      return this.isVisEditable();
    } else {
      if (!this.dataLayer) {
        return false;
      } else if (this.dataLayer && (this.dataLayer.isReadOnly() || !this.dataLayer.permission.isOwner(this.user))) {
        return false;
      } else {
        return true;
      }
    }
  },

  isMetadataEditable: function() {
    if (this.vis.isVisualization()) {
      return this.isVisEditable();
    } else {
      if (!this.dataLayer) {
        return false;
      } else if (this.dataLayer && (this.dataLayer.isInSQLView() || !this.dataLayer.permission.isOwner(this.user))) {
        return false;
      } else {
        return true;
      }
    }
  }

})