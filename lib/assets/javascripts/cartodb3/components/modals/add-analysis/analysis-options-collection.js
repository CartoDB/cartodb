var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisOptionModel = require('./analysis-option-models/analysis-option-model');

module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var Model = d.Model || AnalysisOptionModel;

    var attrs = _.omit(d, 'Model', 'nodeAttrs');

    return new Model(attrs, {nodeAttrs: d.nodeAttrs});
  },

  initialize: function (models, opts) {
    this.on('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m !== changedModel) {
          m.set('selected', false);
        }
      });
    }
  }

});
