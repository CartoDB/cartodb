var Backbone = require('backbone');
var syncAbort = require('../../../data/backbone/sync-abort');

/**
 *  Edit vis metadata dialog model
 *  to control if name and metadata
 *  are editable or not.
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    name: '',
    description: '',
    tags: ''
  },

  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

    this._visDefinitionModel = opts.visDefinitionModel;

    var data = {
      name: this._visDefinitionModel.get('name'),
      description: this._visDefinitionModel.get('description'),
      tags: this._visDefinitionModel.get('tags')
    };

    this.set(data);

    // Validation control variable
    this._errors = [];
    this._initBinds();
  },

  _initBinds: function () {
    this.on('invalid', this._onInvalid, this);
  },

  _onInvalid: function (model, error) {
    this._errors.push(error);
  },

  validate: function (attrs) {
    this._cleanErrors();

    if (!attrs) return;
    if (!attrs.name) {
      return _t('components.modals.maps-metadata.validation.error.name');
    }
  },

  _cleanErrors: function () {
    this._errors = [];
  },

  getErrors: function () {
    return this._errors;
  }

});
