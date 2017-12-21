var cdb = require('cartodb.js-v3');

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
    if (!opts || !opts.vis || !opts.user || !opts.dataLayer) {
      throw new Error('Visualization, user and dataLayer models are required');
    }
    this.vis = opts.vis;
    this.user = opts.user;
    this.dataLayer = opts.dataLayer;

    var data = {
      name: this.vis.get('name'),
      description: this.vis.get('description'),
      tags: this.vis.get('tags'),
      privacy: this.vis.get('privacy')
    };
    if (!this.vis.isVisualization()) {
      // Additional fields, only for dataset, w/ fallbacks for defaults
      data.source = this.vis.get('source') || '';
      data.attributions = this.vis.get('attributions') || '';
      data.license = this.vis.get('license') || '';
      data.display_name = this.vis.get('display_name') || '';
    }
    this.set(data);

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
  _validate: function(attrs) {
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
  isDataset: function() {
    return !this.vis.isVisualization();
  },

  isVisEditable: function() {
    return this.vis.permission.isOwner(this.user);
  },

  isAttributeEditable: function(type) {
    if (this.vis.isVisualization()) {
      return this.isVisEditable();
    } else {
      var isReadOnly = type === "name" ? this.dataLayer.isReadOnly() : false;
      if (!this.dataLayer) {
        return false;
      } else if (this.dataLayer && (isReadOnly || !this.dataLayer.permission.isOwner(this.user))) {
        return false;
      } else {
        return true;
      }
    }
  },

  isNameEditable: function() {
    return this.isAttributeEditable('name');
  },

  isMetadataEditable: function() {
    return this.isAttributeEditable('rest');
  }

});
