var _ = require('underscore');
var FONTS_LIST = [
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
];

// Depending the type of the style, if could provide different schema values
function getOptionsByStyleType (params) {
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  var optionsArray = getSchemaColumns(params.querySchemaModel, params.filterFunction);

  switch (params.styleType) {
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
    case 'animation':
      if (params.animationType === 'heatmap') {
        optionsArray = [{
          val: 'cartodb_id',
          label: 'cartodb_id',
          type: 'number'
        }];
      }
      break;
    default:
      // Nothing
  }

  return optionsArray;
}

// Provide an array of columns from the current schema
function getSchemaColumns (querySchemaModel, filterFunction) {
  if (!querySchemaModel) throw new Error('querySchemaModel is required');

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

function generateSelectByStyleType (params) {
  if (!params.componentName) throw new Error('componentName is required');
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.styleType) throw new Error('styleType is required');

  var queryStatus = params.querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.' + params.componentName + '.' + queryStatus);

  return {
    type: 'Select',
    title: _t('editor.style.components.' + params.componentName + '.label'),
    help: isDisabled ? helpMessage : '',
    options: getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      filterFunction: params.filterFunction,
      styleType: params.styleType
    }),
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

function generateSimpleStroke (params) {
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.configModel) throw new Error('configModel is required');
  if (!params.userModel) throw new Error('userModel is required');
  if (!params.modals) throw new Error('modals is required');

  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    options: [],
    query: params.querySchemaModel.get('query'),
    configModel: params.configModel,
    userModel: params.userModel,
    modals: params.modals,
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

function generateLineStroke (params) {
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.configModel) throw new Error('configModel is required');
  if (!params.styleType) throw new Error('styleType is required');
  if (!params.userModel) throw new Error('userModel is required');
  if (!params.modals) throw new Error('modals is required');

  var queryStatus = params.querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.stroke.' + queryStatus);

  return {
    type: 'Fill',
    title: _t('editor.style.components.stroke.label'),
    help: isDisabled ? helpMessage : '',
    options: getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType
    }),
    query: params.querySchemaModel.get('query'),
    configModel: params.configModel,
    userModel: params.userModel,
    modals: params.modals,
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
  'fill': function (params) {
    var editorAttrs = {
      size: {
        min: 1,
        max: 45,
        step: 0.5
      }
    };
    var options = getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    if (params.styleType === 'heatmap') {
      editorAttrs.size.hidePanes = ['value'];
      editorAttrs.color = {
        hidePanes: ['fixed']
      };
    } else if (params.styleType === 'simple' && params.queryGeometryModel.get('simple_geom') === 'point') {
      editorAttrs.color = {
        imageEnabled: true
      };
    }

    if (params.styleType === 'animation') {
      editorAttrs.size.hidePanes = ['value'];

      if (params.animationType === 'simple') {
        editorAttrs.color = {
          categorizeColumns: true
        };
      } else {
        editorAttrs.color = {
          hidePanes: ['fixed']
        };
      }
    }

    return {
      type: 'Fill',
      title: _t('editor.style.components.fill'),
      options: options,
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      validators: ['required'],
      editorAttrs: editorAttrs,
      modals: params.modals
    };
  },

  'stroke': function (params) {
    if (params.queryGeometryModel.get('simple_geom') === 'line') {
      return generateLineStroke({
        querySchemaModel: params.querySchemaModel,
        styleType: params.styleType,
        configModel: params.configModel,
        userModel: params.userModel,
        modals: params.modals
      });
    } else {
      return generateSimpleStroke({
        querySchemaModel: params.querySchemaModel,
        configModel: params.configModel,
        userModel: params.userModel,
        modals: params.modals
      });
    }
  },

  'blending': function (params) {
    var animationOptions = ['lighter', 'multiply', 'source-over', 'xor'];
    var simpleOptions = ['none', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'xor', 'src-over'];
    var labelTranslate = 'editor.style.components.blending.options';

    var generateBlendingOptions = function (options) {
      return _.reduce(options, function (memo, option) {
        memo.push({
          val: option,
          label: _t(labelTranslate + '.' + option)
        });
        return memo;
      }, []);
    };

    return {
      type: 'Select',
      title: _t('editor.style.components.blending.label'),
      options: generateBlendingOptions(params.styleType === 'animation' ? animationOptions : simpleOptions)
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

  'aggregation-dataset': function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.aggregation-dataset'),
      options: [
        {
          val: 'countries'
        }, {
          val: 'provinces'
        }
      ]
    };
  },

  'aggregation-value': function (params) {
    return {
      type: 'Operators',
      title: _t('editor.style.components.aggregation-value'),
      options: getSchemaColumns(params.querySchemaModel)
    };
  },

  'labels-enabled': function () {
    return {
      type: 'Hidden'
    };
  },

  'labels-attribute': function (params) {
    var filterFunction = function (item) {
      var columnName = item.get('name');
      var columnType = item.get('type');
      return (columnName !== 'the_geom' && columnName !== 'the_geom_webmercator' && columnType !== 'date');
    };
    return generateSelectByStyleType({
      componentName: 'labels-attribute',
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      filterFunction: filterFunction
    });
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
      options: FONTS_LIST
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
    var placements = ['point', 'line', 'vertex', 'interior'];
    var translateLabel = 'editor.style.components.labels-placement.options';

    return {
      type: 'Select',
      title: _t('editor.style.components.labels-placement.label'),
      options: _.reduce(placements, function (memo, type) {
        memo.push({
          val: type,
          label: _t(translateLabel + '.' + type)
        });
        return memo;
      }, []),
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

  'animated-attribute': function (params) {
    var filterFunction = function (item) {
      var columnType = item.get('type');
      if (columnType && (columnType === 'number' || columnType === 'date')) {
        return true;
      }
      return false;
    };

    if (params.styleType === 'heatmap') {
      return generateSelectWithSchemaColumns({
        componentName: 'animated-attribute',
        querySchemaModel: params.querySchemaModel,
        filterFunction: filterFunction
      });
    } else {
      return generateSelectByStyleType({
        componentName: 'animated-attribute',
        querySchemaModel: params.querySchemaModel,
        filterFunction: filterFunction,
        styleType: params.styleType
      });
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
        min: 1,
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
