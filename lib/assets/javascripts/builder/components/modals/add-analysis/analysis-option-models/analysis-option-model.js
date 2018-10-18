var _ = require('underscore');
var Backbone = require('backbone');
var camshaftReference = require('builder/data/camshaft-reference');
var nodeIds = require('builder/value-objects/analysis-node-ids');

module.exports = Backbone.Model.extend({

  defaults: {
    title: '',
    category: '',
    selected: false,
    type_group: '',
    desc: '',
    link: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.nodeAttrs) throw new Error('nodeAttrs is required');

    this._nodeAttrs = opts.nodeAttrs;
  },

  belongsTo: function (category) {
    return this.get('category') === category;
  },

  acceptsGeometryTypeAsInput: function (simpleGeometryType) {
    if (this.get('dummy') === true) return true;
    return camshaftReference.isValidInputGeometryForType(simpleGeometryType, this._nodeAttrs.type);
  },

  getValidInputGeometries: function () {
    return camshaftReference.getValidInputGeometriesForType(this._nodeAttrs.type);
  },

  getFormAttrs: function (layerDefModel) {
    var letter = layerDefModel.get('letter');
    var sourceId = layerDefModel.get('source');

    return _.extend(
      {
        source: sourceId,
        id: letter === nodeIds.letter(sourceId)
          ? nodeIds.next(sourceId)
          : letter + '1'
      },
      this._nodeAttrs
    );
  }

});
