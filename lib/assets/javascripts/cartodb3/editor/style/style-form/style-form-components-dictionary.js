var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
var Polyglot = require('node-polyglot');
var Locale = require('../../../../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

var _t = polyglot.t.bind(polyglot);

// Depending the type of the style, if could provide different schema values
function getOptionsByStyleType (querySchemaModel, filterFunction, styleType) {
  var optionsArray;

  switch (styleType) {
    case 'heatmap':
    case 'regions':
      optionsArray = ['points_agg'];
      break;
    case 'hexabins':
    case 'squares':
      optionsArray = ['points_count', 'points_density'];
      break;
    default:
      optionsArray = getSchemaColumns(querySchemaModel, filterFunction);
  }

  return optionsArray;
}

function getSchemaColumns (querySchemaModel, filterFunction) {
  var columnsCollection = querySchemaModel.columnsCollection;
  if (filterFunction) {
    columnsCollection = columnsCollection[filterFunction];
  }
  return columnsCollection
    .map(function (m) {
      var columnName = m.get('name');
      return {
        val: columnName,
        label: columnName,
        type: m.get('type')
      };
    });
}

function generateSelectByStyleType (componentName, querySchemaModel, filterFunction, styleType) {
  var queryStatus = querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.' + componentName + '.' + queryStatus);

  return {
    type: 'Select',
    title: _t('editor.style.components.' + componentName + '.label'),
    help: isDisabled ? helpMessage : '',
    options: getOptionsByStyleType(querySchemaModel, filterFunction, styleType),
    editorAttrs: { disabled: isDisabled },
    validators: ['required']
  };
}

function generateSelectWithSchemaColumns (componentName, querySchemaModel, filterFunction) {
  var queryStatus = querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.' + componentName + '.' + queryStatus);

  return {
    type: 'Select',
    title: _t('editor.style.components.' + componentName + '.label'),
    help: isDisabled ? helpMessage : '',
    options: getSchemaColumns(querySchemaModel, filterFunction),
    editorAttrs: { disabled: isDisabled },
    validators: ['required']
  };
}

function generateSimpleStroke () {
  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    options: [],
    editorAttrs: {
      size: {
        min: 0,
        max: 10,
        step: 0.5,
        hidePanes: ['value']
      },
      color: {
        hidePanes: ['value']
      }
    },
    validators: ['required']
  };
}

function generateLineStroke (querySchemaModel, styleType) {
  var queryStatus = querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.stroke.' + queryStatus);

  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    help: isDisabled ? helpMessage : '',
    options: getOptionsByStyleType(querySchemaModel, null, styleType),
    editorAttrs: {
      min: 0,
      max: 50,
      disabled: isDisabled
    },
    validators: ['required']
  };
}

/*
 *  Dictionary that contains all the necessary components
 *  for the styles form
 */

module.exports = {

  'fill': function (querySchemaModel, styleType) {
    return {
      type: 'Fill',
      title: _t('editor.style.components.fill'),
      options: getOptionsByStyleType(querySchemaModel, null, styleType),
      validators: ['required'],
      editorAttrs: {
        size: {
          min: 1,
          max: 40,
          step: 0.5
        }
      }
    };
  },

  'stroke': function (querySchemaModel, styleType) {
    var geom = querySchemaModel.getGeometry();

    if (geom && geom.getSimpleType() === 'line') {
      return generateLineStroke(querySchemaModel, styleType);
    } else {
      return generateSimpleStroke(querySchemaModel);
    }
  },

  'blending': function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.blending.label'),
      options: [
        {
          val: 'none',
          label: _t('editor.style.components.blending.options.none')
        },
        {
          val: 'multiply',
          label: _t('editor.style.components.blending.options.multiply')
        },
        {
          val: 'screen',
          label: _t('editor.style.components.blending.options.screen')
        },
        {
          val: 'overlay',
          label: _t('editor.style.components.blending.options.overlay')
        },
        {
          val: 'darken',
          label: _t('editor.style.components.blending.options.darken')
        },
        {
          val: 'lighten',
          label: _t('editor.style.components.blending.options.lighten')
        },
        {
          val: 'color-dodge',
          label: _t('editor.style.components.blending.options.color-dodge')
        },
        {
          val: 'color-burn',
          label: _t('editor.style.components.blending.options.color-burn')
        }
      ]
    };
  },

  'aggregation-size': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.aggregation-size.label'),
      help: _t('editor.style.components.aggregation-size.help'),
      validators: ['required', {
        type: 'interval',
        min: 15,
        max: 100
      }]
    };
  },

  'aggregation-dataset': function (querySchemaModel) {
    return {
      type: 'Select',
      title: _t('editor.style.components.aggregation-dataset'),
      options: [
        {
          val: 'countries'
        }, {
          val: 'zip-codes'
        }, {
          val: 'provinces'
        }, {
          val: 'counties'
        }, {
          val: 'neighborhood'
        }
      ]
    };
  },

  'aggregation-value': function (querySchemaModel) {
    return {
      type: 'Operators',
      title: _t('editor.style.components.aggregation-value'),
      options: getSchemaColumns(querySchemaModel)
    };
  },

  'labels-enabled': function () {
    return {
      type: 'Hidden'
    };
  },

  'labels-attribute': function (querySchemaModel, styleType) {
    return generateSelectByStyleType('labels-attribute', querySchemaModel, null, styleType);
  },

  'labels-fill': function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-fill'),
      options: [],
      editorAttrs: {
        size: {
          min: 6,
          max: 24,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  },

  'labels-halo': function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-halo'),
      options: [],
      editorAttrs: {
        size: {
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  },

  'labels-font': function () {
    return {
      type: 'Select',
      options: [
        'DejaVu Sans Book',
        'unifont Medium',
        'Open Sans Regular',
        'Lato Regular',
        'Lato Bold',
        'Lato Bold Italic',
        'Graduate Regular',
        'Gravitas One Regular',
        'Old Standard TT Regular',
        'Old Standard TT Italic',
        'Old Standard TT Bold'
      ]
    };
  },

  'labels-offset': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.labels-offset'),
      validators: ['required', {
        type: 'interval',
        min: -15,
        max: 15
      }]
    };
  },

  'labels-overlap': function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.labels-overlap.label'),
      options: [
        {
          val: 'true',
          label: _t('editor.style.components.labels-overlap.options.true')
        }, {
          val: 'false',
          label: _t('editor.style.components.labels-overlap.options.false')
        }
      ]
    };
  },

  'labels-placement': function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.labels-placement.label'),
      options: [
        {
          val: 'point',
          label: _t('editor.style.components.labels-placement.options.point')
        },
        {
          val: 'line',
          label: _t('editor.style.components.labels-placement.options.line')
        },
        {
          val: 'vertex',
          label: _t('editor.style.components.labels-placement.options.vertex')
        },
        {
          val: 'interior',
          label: _t('editor.style.components.labels-placement.options.interior')
        }
      ],
      editorAttrs: {
        showSearch: false
      }
    };
  },

  'animated-enabled': function () {
    return {
      type: 'Hidden'
    };
  },

  'animated-attribute': function (querySchemaModel, styleType) {
    if (styleType === 'heatmap') {
      return generateSelectWithSchemaColumns('animated-attribute', querySchemaModel);
    } else {
      return generateSelectByStyleType('animated-attribute', querySchemaModel, null, styleType);
    }
  },

  'animated-overlap': function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.animated-overlap.label'),
      options: [
        {
          val: 'false',
          label: _t('editor.style.components.animated-overlap.options.false')
        }, {
          val: 'true',
          label: _t('editor.style.components.animated-overlap.options.true')
        }
      ]
    };
  },

  'animated-duration': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-duration'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 60
      }]
    };
  },

  'animated-steps': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-steps'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 1024,
        step: 4
      }]
    };
  },

  'animated-trails': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-trails'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 5
      }]
    };
  },

  'animated-resolution': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-resolution'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 32
      }]
    };
  }
};
