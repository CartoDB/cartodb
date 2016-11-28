var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var CustomLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    var htmlTemplate = this.model.get('html');
    if (this.model.get('html') === '') {
      htmlTemplate = template({
        items: this.model.get('items')
      });
    }

    return htmlTemplate;
  }
});

module.exports = CustomLegendView;
