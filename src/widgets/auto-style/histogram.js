var AutoStyler = require('./auto-styler');
var StyleUtils = require('./style-utils');
var cartocolor = require('cartocolor');

var HistogramAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;
    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this.getColorLine(item, this.getCustomStyle()));
    }.bind(this));
    return StyleUtils.replaceWrongSpaceChar(style);
  },

  getCustomStyle: function () {
    return this.styles &&
      this.styles.definition &&
      this.styles.definition.fill &&
      this.styles.definition.fill.color;
  },

  getColorLine: function (sym, custom) {
    var scales = custom || {};

    if (!custom) {
      var shape = this.dataviewModel.getDistributionType(
        this.dataviewModel.getUnfilteredDataModel().get('data')
      );

      scales = HistogramAutoStyler.SCALES_MAP[sym][shape];
    }

    var ramp = 'ramp([' + this.dataviewModel.get('column') + '], ';
    var colors = custom ? "('" + scales.range.join("', '") + "'), "
      : 'cartocolor(' + scales.palette + ', ' + this.dataviewModel.get('bins') + '), ';
    var cuantification = scales.quantification + ');';

    return sym + ': ' + ramp + colors + cuantification;
  },

  getDef: function (cartocss) {
    var definitions = {};
    var shape = this.dataviewModel.getDistributionType(
      this.dataviewModel.getUnfilteredDataModel().get('data')
    );
    var bins = this.dataviewModel.get('bins');
    var attr = this.dataviewModel.get('column');

    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      if (cartocss.search(StyleUtils.getAttrRegex(item, false)) >= 0) {
        var scales = HistogramAutoStyler.SCALES_MAP[item][shape];
        var geom = item.substring(0, item.indexOf('-'));

        definitions[geom === 'marker' ? 'point' : geom] = {
          color: {
            range: cartocolor[scales.palette][bins] || cartocolor[scales.palette][Object.keys(cartocolor[scales.palette]).length],
            quantification: scales.quantification,
            attribute: attr
          }
        };
      }
    });

    return definitions;
  }

});

HistogramAutoStyler.SCALES_MAP = {
  'polygon-fill': {
    'F': {
      palette: 'PinkYl',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'Emrld',
      quantification: 'headtails'
    },
    'J': {
      palette: 'Emrld',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'Sunset',
      quantification: 'jenks'
    },
    'U': {
      palette: 'Sunset',
      quantification: 'jenks'
    }
  },
  'line-color': {
    'F': {
      palette: 'PinkYl',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'Emrld',
      quantification: 'headtails'
    },
    'J': {
      palette: 'Emrld',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'Sunset',
      quantification: 'jenks'
    },
    'U': {
      palette: 'Sunset',
      quantification: 'jenks'
    }
  },
  'marker-fill': {
    'F': {
      palette: 'RedOr',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'BluYl',
      quantification: 'headtails'
    },
    'J': {
      palette: 'BluYl',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'SunsetDark',
      quantification: 'jenks'
    },
    'U': {
      palette: 'SunsetDark',
      quantification: 'jenks'
    }
  }
};

module.exports = HistogramAutoStyler;
