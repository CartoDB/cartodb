var _ = require('underscore');

// var FILL = 'fill';
// var STROKE = 'stroke';

/*
var buildAttrsPerType = {};
buildAttrsPerType[FILL] = buildFillSizeAttrs;
buildAttrsPerType[STROKE] = buildStrokeSizeAttrs;
*/

function buildSize (params, customOptions) {
  checkForParams(params);

  var size = {
    type: 'Size',
    query: params.querySchemaModel.get('query'),
    configModel: params.configModel,
    userModel: params.userModel,
    modals: params.modals,
    validators: ['required'],
    dialogMode: 'float', // < ?
    help: buildHelpMessage(params)
  };

  if (customOptions) size = _.extend({}, size, customOptions);

  return size;
}

function checkForParams (params) {
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.configModel) throw new Error('configModel is required');
  if (!params.styleType) throw new Error('styleType is required');
  if (!params.userModel) throw new Error('userModel is required');
  if (!params.modals) throw new Error('modals is required');
}

function buildEditorAttrsForPointSize (params) {
  var editorAttrs = {};
  var size = {
    min: 1,
    max: 45,
    step: 0.5,
    help: _t('editor.style.tooltips.fill.size', {type: _t('editor.style.tooltips.' + params.styleType)})
  };
  if (params.styleType === 'simple') size.defaultRange = [5, 20];
  if (_.contains(['heatmap', 'animation'], params.styleType)) size.hidePanes = ['value']; // just fixed option

  editorAttrs.size = size;
  return editorAttrs;
}

function buildHelpMessage (params) {
  var message = '';

  // just for lineStroke
  if (isQueryNotFetched(params) && hasGeometryOf(params, 'line')) {
    message = _t('editor.style.components.stroke.' + params.querySchemaModel.get('status'));
  }

  return message;
}

function hasGeometryOf (params, type) {
  return params.queryGeometryModel && params.queryGeometryModel.get('simple_geom') === type;
  // TODO refactor to avoid duplication (this could be pushed up to geometryModel itself). DRY!
}

function isQueryNotFetched (params) {
  var queryStatus = params.querySchemaModel.get('status');
  return queryStatus !== 'fetched';
}

function HARD_CODED_NUMBER_EDITOR () {
  return {
    type: 'Number',
    title: '[WIP] ' + _t('editor.style.components.point-size.label'),
    validators: ['required', {
      type: 'interval',
      min: 1,
      max: 45,
      step: 0.5
    }]
  };
}

// function D_buildFillSizeAttrs (params) {
//   var editorAttrs = {};

//   var tooltipSuffix = hasGeometryOf(params, 'polygon') ? 'polygon' : params.styleType;
//   var size = {
//     min: 1,
//     max: 45,
//     step: 0.5,
//     help: _t('editor.style.tooltips.fill.size', {type: _t('editor.style.tooltips.' + tooltipSuffix)})
//   };
//   if (params.styleType === 'simple' && hasGeometryOf(params, 'point')) size.defaultRange = [5, 20];
//   if (_.contains(['heatmap', 'animation'], params.styleType)) size.hidePanes = ['value']; // just fixed option

//   editorAttrs.size = size;

//   return editorAttrs;
// }

// function D_buildStrokeSizeAttrs (params) {
//   var editorAttrs = {};

//   if (hasGeometryOf(params, 'line')) {
//     // lineStroke
//     editorAttrs = {
//       min: 0, // << TODO not size attrs...
//       max: 50,
//       disabled: isQueryNotFetched(params),
//       size: {
//         defaultRange: [1, 5],
//         help: _t('editor.style.tooltips.stroke.size', {type: _t('editor.style.tooltips.line')})
//       }
//     };
//   } else {
//     // simpleStroke
//     var tooltipSuffix = hasGeometryOf(params, 'polygon') ? 'polygon' : params.styleType;
//     editorAttrs = {
//       size: {
//         min: 0,
//         max: 10,
//         step: 0.5,
//         hidePanes: ['value'],
//         help: _t('editor.style.tooltips.stroke.size', {type: _t('editor.style.tooltips.' + tooltipSuffix)})
//       }
//     };
//   }

//   return editorAttrs;
// }

module.exports = {
  /*
  getFillSize: function (params, options) {
    var geometryType = params.queryGeometryModel.get('simple_geom');

    switch (geometryType) {
      case 'point':
        return getPointSize(params, options);
      default:
        throw Error('Not implemented yet!');
    }
  },
  */

  getPointSize: function (params, options) {
    // return HARD_CODED_NUMBER_EDITOR();
    var size = buildSize(params, {
      options: options,
      title: '>> ' + _t('editor.style.components.point-size.label'),
      editorAttrs: buildEditorAttrsForPointSize(params)
    });
    return size;
  }

  /*
  getStrokeSize: function (params, options) {
    return getSize(params, options, STROKE);
  }
  */
};
