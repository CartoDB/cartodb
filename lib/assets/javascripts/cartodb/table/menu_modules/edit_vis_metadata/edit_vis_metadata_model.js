/**
 *  Edit vis metadata model
 *  to control if name and metadata
 *  are editable or not.
 *
 */

cdb.core.MetadataModel = cdb.core.Model.extend({
  defaults: {
    name: '',
    description: '',
    tags: '',
    privacy: ''
  },

  initialize: function (attrs) {
    if (!attrs || !attrs.vis || !attrs.user || !attrs.dataLayer) {
      throw new Error('Visualization, user and dataLayer models are required');
    }
    this.vis = attrs.vis;
    this.user = attrs.user;
    this.dataLayer = attrs.dataLayer;

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
      data.exportable = this.vis.get('exportable') === true;
      data.export_geom = this.vis.get('export_geom') === true;
    }
    this.set(data);

    // Validation control variable
    this.validationError = '';
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('valid', function () {
      this.validationError = '';
    }, this);
    this.bind('error', function (m, error) {
      this.validationError = error;
    }, this);
  },

  // Validation
  _validate: function (attrs) {
    var valid = cdb.core.Model.prototype._validate.apply(this, arguments);
    if (valid) {
      this.trigger('valid');
      return true;
    } else {
      return false;
    }
  },

  validate: function (attrs) {
    if (!attrs) return;

    if (!attrs.name) {
      return "Name can't be blank";
    }
  },

  getError: function () {
    return this.validationError;
  },

  isValid: function () {
    if (!this.validate) {
      return true;
    }
    return !this.validate(this.attributes) && this.validationError === '';
  },

  // Helper functions
  isDataset: function () {
    return !this.vis.isVisualization();
  },

  isVisEditable: function () {
    return this.vis.permission.isOwner(this.user);
  },

  isAttributeEditable: function (type) {
    if (this.vis.isVisualization()) {
      return this.isVisEditable();
    } else {
      var isReadOnly = type === 'name' ? this.dataLayer.isReadOnly() : false;
      var dataLayerPermission = true;
      if (this.dataLayer.get('permission')) {
        dataLayerPermission = this.dataLayer.permission.isOwner(this.user);
      }
      if (!this.dataLayer) {
        return false;
      } else if (this.dataLayer && (isReadOnly || !dataLayerPermission)) {
        return false;
      } else {
        return true;
      }
    }
  },

  isNameEditable: function () {
    return this.isAttributeEditable('name');
  },

  isMetadataEditable: function () {
    return this.isAttributeEditable('rest');
  }

});
