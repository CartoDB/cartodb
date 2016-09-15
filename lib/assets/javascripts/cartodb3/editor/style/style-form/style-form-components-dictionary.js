var _ = require('underscore');

// Depending the type of the style, if could provide different schema values
function getOptionsByStyleType (querySchemaModel, filterFunction, styleType) {
  var optionsArray;

  switch (styleType) {
    case 'heatmap':
      optionsArray = [{
        val: 'cartodb_id',
        label: 'cartodb_id',
        type: 'number'
      }];
      break;
    case 'regions':
      optionsArray = [{
        val: 'agg_value',
        label: 'agg_value',
        type: 'number'
      }, {
        val: 'agg_value_density',
        label: 'agg_value_density',
        type: 'number'
      }];
      break;
    case 'hexabins':
    case 'squares':
      optionsArray = [{
        val: 'agg_value',
        label: 'agg_value',
        type: 'number'
      }];
      break;
    default:
      optionsArray = getSchemaColumns(querySchemaModel, filterFunction);
  }

  return optionsArray;
}

function getSchemaColumns (querySchemaModel, filterFunction) {
  var columnsCollection = querySchemaModel.columnsCollection;
  if (filterFunction) {
    columnsCollection = columnsCollection.filter(filterFunction);
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

function generateSimpleStroke (querySchemaModel, configModel) {
  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    options: [],
    query: querySchemaModel.get('query'),
    configModel: configModel,
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

function generateLineStroke (querySchemaModel, styleType, configModel) {
  var queryStatus = querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.stroke.' + queryStatus);

  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    help: isDisabled ? helpMessage : '',
    options: getOptionsByStyleType(querySchemaModel, null, styleType),
    query: querySchemaModel.get('query'),
    configModel: configModel,
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
  'fill': function (querySchemaModel, styleType, queryGeometryModel, configModel) {
    var editorAttrs = {
      size: {
        min: 1,
        max: 45,
        step: 0.5
      }
    };

    if (styleType === 'heatmap') {
      editorAttrs.size.hidePanes = ['value'];
      editorAttrs.color = {
        hidePanes: ['fixed']
      };
    }

    return {
      type: 'Fill',
      title: _t('editor.style.components.fill'),
      options: getOptionsByStyleType(querySchemaModel, null, styleType),
      query: querySchemaModel.get('query'),
      configModel: configModel,
      validators: ['required'],
      editorAttrs: editorAttrs
    };
  },

  'stroke': function (querySchemaModel, styleType, queryGeometryModel, configModel) {
    if (queryGeometryModel.get('simple_geom') === 'line') {
      return generateLineStroke(querySchemaModel, styleType, configModel);
    } else {
      return generateSimpleStroke(querySchemaModel, configModel);
    }
  },

  'blending': function (querySchemaModel, styleType, queryGeometryModel) {
    var animationOptions = ['lighter', 'multiply', 'source-over', 'xor'];
    var simpleOptions = ['none', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'xor', 'src-over'];
    var options = [
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
        val: 'lighter',
        label: _t('editor.style.components.blending.options.lighter')
      },
      {
        val: 'color-dodge',
        label: _t('editor.style.components.blending.options.color-dodge')
      },
      {
        val: 'color-burn',
        label: _t('editor.style.components.blending.options.color-burn')
      },
      {
        val: 'xor',
        label: _t('editor.style.components.blending.options.xor')
      },
      {
        val: 'source-over',
        label: _t('editor.style.components.blending.options.source-over')
      },
      {
        val: 'src-over',
        label: _t('editor.style.components.blending.options.src-over')
      }
    ];

    var filterFunction = function (option) {
      return _.contains(styleType === 'animation' ? animationOptions : simpleOptions, option.val);
    };

    return {
      type: 'Select',
      title: _t('editor.style.components.blending.label'),
      options: _.filter(options, filterFunction)
    };
  },

  'style': function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.type.label'),
      options: [
        {
          val: 'simple',
          label: _t('editor.style.components.type.options.points')
        }, {
          val: 'heatmap',
          label: _t('editor.style.components.type.options.heatmap')
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
        min: 10,
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
          val: 'provinces'
        }/*, {
          val: 'counties'
        }, {
          val: 'zip-codes'
        }, {
          val: 'neighborhood'
        }*/
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

  'labels-attribute': function (querySchemaModel, styleType, queryGeometryModel) {
    var filterFunction = function (item) {
      var columnName = item.get('name');
      var columnType = item.get('type');
      return (columnName !== 'the_geom' && columnName !== 'the_geom_webmercator' && columnType !== 'date');
    };
    return generateSelectByStyleType('labels-attribute', querySchemaModel, filterFunction, styleType);
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

  'animated-attribute': function (querySchemaModel, styleType, queryGeometryModel) {
    var filterFunction = function (item) {
      var columnType = item.get('type');
      if (columnType && (columnType === 'number' || columnType === 'date')) {
        return true;
      }
      return false;
    };

    if (styleType === 'heatmap') {
      return generateSelectWithSchemaColumns('animated-attribute', querySchemaModel, filterFunction);
    } else {
      return generateSelectByStyleType('animated-attribute', querySchemaModel, filterFunction, styleType);
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
        max: 30
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
        max: 16
      }]
    };
  }
};
