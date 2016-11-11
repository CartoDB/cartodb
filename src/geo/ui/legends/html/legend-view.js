var LegendViewBase = require('../base/legend-view-base');

var HTMLLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return this._patchStylesForIE(this.model.get('html'));
  },

  _patchStylesForIE: function (str) {
    var find = /\bstyle=(['"])/g;
    var replace = 'style="opacity:1; ';
    return str.replace(find, replace);
  }
});

module.exports = HTMLLegendView;
