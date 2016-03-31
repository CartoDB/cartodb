var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this.schema = {
      points_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.points_source'),
        options: [ this.get('points_source') ]
      },
      polygons_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.polygons_source'),
        options: [ this.get('polygons_source') ]
      }
    };
  },

  validate: function (attrs, opts) {
    return this._analysisDefinitionNodeModel.validate(this.attributes, opts);
  }

});
