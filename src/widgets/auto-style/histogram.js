var AutoStyler = require('./auto-styler');
var HistogramAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
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
                 ')), ' + scales.quantification + ')';
  }

});

HistogramAutoStyler.SCALES_MAP = {
  'polygon-fill': {
    'F': {
      palette: 'Sunset3',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'J': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'Emrld1',
      quantification: 'jenks'
    },
    'U': {
      palette: 'Emrld1',
      quantification: 'jenks'
    }
  },
  'line-color': {
    'F': {
      palette: 'Sunset3',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'J': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'Emrld1',
      quantification: 'jenks'
    },
    'U': {
      palette: 'Emrld1',
      quantification: 'jenks'
    }
  },
  'marker-fill': {
    'F': {
      palette: 'RedOr1',
      quantification: 'quantiles'
    },
    'L': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'J': {
      palette: 'Sunset2',
      quantification: 'headtails'
    },
    'A': {
      palette: 'Geyser',
      quantification: 'quantiles'
    },
    'C': {
      palette: 'BluYl1',
      quantification: 'jenks'
    },
    'U': {
      palette: 'BluYl1',
      quantification: 'jenks'
    }
  }
};

module.exports = HistogramAutoStyler;

