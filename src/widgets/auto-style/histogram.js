var AutoStyler = require('./auto-styler');
var StyleUtils = require('./style-utils');

var HistogramAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    var custom = null;
    if (!style) return;
    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this.getColorLine(item, this.getCustomStyle()));
    }.bind(this));
    return style;
  },

  getCustomStyle: function () {
    return this.styles
      && this.styles.definition
      && this.styles.definition.fill
      && this.styles.definition.fill.color;
  },

  getColorLine: function (sym, custom) {
    var scales = custom || {};

    if (!custom) {
      var shape = this.dataviewModel.getDistributionType(
        this.dataviewModel.getUnfilteredDataModel().get('data')
      );

      scales = HistogramAutoStyler.SCALES_MAP[sym][shape];
    }

    var ramp = 'ramp([' + this.dataviewModel.get('column') + '], ',
        colors = custom ? "('" + scales.range.join("', '") + "'), "
          : 'cartocolor(' + scales.palette + ', ' + this.dataviewModel.get('bins') + '), ',
        cuantification = scales.quantification + ');';

    console.log(sym + ': ' + ramp + colors + cuantification);

    return sym + ': ' + ramp + colors + cuantification;
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
