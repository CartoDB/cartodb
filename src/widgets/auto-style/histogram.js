var AutoStyler = require('./auto-styler');
var HistogramAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;
    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = style.replace(new RegExp('\\' + 's' + item + ':.*?;', 'g'), this.getColorLine(item));
    }.bind(this));
    return style;
  },

  getColorLine: function (sym) {
    var shape = this.dataviewModel.getDistributionType();
    var scales = HistogramAutoStyler.SCALES_MAP[sym][shape];
    return sym + ': ramp([' + this.dataviewModel.get('column') +
                 '], cartocolor(' + scales.palette + ', ' + this.dataviewModel.get('bins') +
                 ')), ' + scales.quantification + ');';
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
<<<<<<< HEAD
      palette: 'Sunset',
=======
      palette: 'PinkYl',
>>>>>>> master
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
