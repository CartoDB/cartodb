var _ = require('underscore');
var camshaftReference = require('../../../../data/camshaft-reference');
var nodeIds = require('../../../../value-objects/analysis-node-ids');

module.exports = cdb.core.Model.extend({

  defaults: {
    title: '',
    selected: false,
    type_group: '',
    desc: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.nodeAttrs) throw new Error('nodeAttrs is required');

    this._nodeAttrs = opts.nodeAttrs;
  },

  acceptsGeometryTypeAsInput: function (simpleGeometryType) {
    return camshaftReference.isValidInputGeometryForType(simpleGeometryType, this._nodeAttrs.type);
  },

  getValidInputGeometries: function () {
    return camshaftReference.getValidInputGeometriesForType(this._nodeAttrs.type);
  },

  getFormAttrs: function (sourceId, sourceSimpleGeometryType) {
    return _.extend(
      {
        id: nodeIds.next(sourceId),
        source: sourceId
      },
      this._nodeAttrs
    );
  }

});
