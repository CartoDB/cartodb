var _ = require('underscore');
var Model = require('../core/model');

module.exports = Model.extend({
  findAnalysisById: function (analysisId) {
    if (this.get('id') === analysisId) {
      return this;
    }
    if (this.get('params').source) {
      var source = this.get('params').source;
      return source.findAnalysisById(analysisId);
    }
  },

  remove: function () {
    this.trigger('destroy', this);
  },

  toJSON: function () {
    var json;
    if (this.get('type') === 'source') {
      json = this.attributes;
    } else if (this.get('params').source) {
      var params = _.clone(this.get('params'));
      json = {
        id: this.get('id'),
        type: this.get('type'),
        params: _.extend(params, {
          source: this.get('params').source.toJSON()
        })
      };
    }
    return json;
  }
});
