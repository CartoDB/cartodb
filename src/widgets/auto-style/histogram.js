var _ = require('underscore');
var cartocolor = require('cartocolor');
var AutoStyler = require('./auto-styler');
var StyleUtils = require('./style-utils');

var HistogramAutoStyler = AutoStyler.extend({
  updateStyle: function (style) {
    this.styles = style.auto_style;
  },

  _getFillColor: function (sym) {
    var custom = this._getColor();
    var scales = custom || {};

    if (!custom) {
      var shape = this.dataviewModel.getDistributionType(
        this.dataviewModel.getUnfilteredDataModel().get('data')
      );

      scales = HistogramAutoStyler.SCALES_MAP[sym][shape];
    }

    var ramp = 'ramp([' + this.dataviewModel.get('column') + '], ';
    var colors = custom
      ? "('" + scales.range.join("', '") + "'), "
      : 'cartocolor(' + scales.palette + ', ' + this.dataviewModel.get('bins') + '), ';
    var cuantification = scales.quantification + ')';

    return ramp + colors + cuantification;
  },

  getDef: function (cartocss) {
    var definitions = {};
    var shape = this.dataviewModel.getDistributionType(
      this.dataviewModel.getUnfilteredDataModel().get('data')
    );
    var bins = this.dataviewModel.get('bins');
    var attr = this.dataviewModel.get('column');
    var styles = this.styles;
    var isCustomDefinition = (this.styles && this.styles.custom) || false;

    AutoStyler.FILL_SELECTORS.forEach(function (item) {
      if (StyleUtils.isPropertyIncluded(cartocss, item)) {
        var scales = HistogramAutoStyler.SCALES_MAP[item][shape];
        var geom = item.substring(0, item.indexOf('-'));
        var definition = {};

        if (scales) {
          if (isCustomDefinition === true) {
            definition = _.extend(definition, styles.definition);
          } else {
            definition = {
              color: {
                range: cartocolor[scales.palette][bins] || cartocolor[scales.palette][Object.keys(cartocolor[scales.palette]).length],
                quantification: scales.quantification,
                attribute: attr
              }
            };
          }
        }

        definitions[geom === 'marker' ? 'point' : geom] = definition;
      }
    });

    return definitions;
  }

});

HistogramAutoStyler.SCALES_MAP = {
  'polygon-fill': {
    'F': {
      palette: 'PinkYl',
      quantification: 'equal'
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
      quantification: 'equal'
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
      quantification: 'equal'
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
