var LegendViewBase = require('./legend-view-base');
var template = require('./bubble-legend-template.tpl');

var BubbleLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this.model.get('title'),
      bubbles: this.model.get('bubbles'),
      avg: this.model.get('avg'),
      fillColor: this.model.get('fillColor')
    });
  }
});

module.exports = BubbleLegendView;
