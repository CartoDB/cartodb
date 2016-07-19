var Backbone = require('backbone');
var MosaicModel = require('../components/mosaic/mosaic-item-model');
var _ = require('underscore');

/**
 *  Organization info model
 *
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var m = new MosaicModel(d, {
      // parse: true,
      collection: self
    });

    return m;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('visualization');
    return baseUrl + '/api/' + version + '/users/' + this._currentUserId + '/layers';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');

    this._configModel = opts.configModel;
    this._currentUserId = opts.currentUserId;

    this._initBinds();
  },

  custom: function () {
    return this.where({ category: undefined });
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid && m.get('selected')) {
          m.set('selected', false);
        }
      });
    }
  },

  getSelected: function () {
    return _.first(this.where({ selected: true }));
  },

  getHighlighted: function () {
    return _.first(this.where({ highlighted: true }));
  }

});
