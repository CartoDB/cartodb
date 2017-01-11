var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var CustomLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    var htmlTemplate = this.model.get('html');
    if (htmlTemplate === '') {
      htmlTemplate = template({
        items: this.model.get('items')
      });
    } else {
      htmlTemplate = this._patchStylesForIE(htmlTemplate);
    }
    return htmlTemplate;
  },

  _patchStylesForIE: function (str) {
    var find = /\bstyle=(['"])/g;
    var replace = 'style="opacity:1; ';
    return str.replace(find, replace);
  }
});

module.exports = CustomLegendView;
