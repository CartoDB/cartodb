var _ = require('underscore');

var DEFAULT_SIZE = {
  min: 1,
  max: 45,
  step: 0.5
};

function fillSize (params, options) {
  var size = buildSize(params, {
    options: options,
    title: _t('editor.style.components.point-size.label'), // TODO: add resource at en.json for each one
    editorAttrs: buildFillSizeAttrs(params)
  });

  return size;
}

/*
function strokeSize (params, options) {
}
*/

function buildSize (params, customOptions) {
  checkForParams(params);

  var size = {
    type: 'Size',
    query: params.querySchemaModel.get('query'),
    configModel: params.configModel,
    userModel: params.userModel,
    modals: params.modals,
    validators: ['required']
  };

  size = _.extend(size, customOptions);

  return size;
}

function checkForParams (params) {
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.configModel) throw new Error('configModel is required');
  if (!params.styleType) throw new Error('styleType is required');
  if (!params.userModel) throw new Error('userModel is required');
  if (!params.modals) throw new Error('modals is required');
}

function buildFillSizeAttrs (params) {
  var size = _.extend({}, DEFAULT_SIZE);
  setDefaultRangeIfNeeded(params, size);
  hideByValuePaneIfNotAllowed(params, size);
  return size;
}

function setDefaultRangeIfNeeded (params, size) {
  if ('simple' === params.styleType && hasGeometryOf(params, 'point')) {
    size.defaultRange = [5, 20];
  }
}

function hideByValuePaneIfNotAllowed (params, size) {
  if (_.contains(['heatmap', 'animation'], params.styleType)) {
    size.hidePanes = ['value'];
  }
}

/*
function buildHelpMessage (params) {
  var message = '';

  // just for lineStroke
  if (isQueryNotFetched(params) && hasGeometryOf(params, 'line')) {
    message = _t('editor.style.components.stroke.' + params.querySchemaModel.get('status'));
  }

  return message;
}
*/

function hasGeometryOf (params, type) {
  return params.queryGeometryModel && params.queryGeometryModel.get('simple_geom') === type;
  // TODO refactor to avoid duplication (this could be pushed up to geometryModel itself). DRY!
}

/*
function isQueryNotFetched (params) {
  var queryStatus = params.querySchemaModel.get('status');
  return queryStatus !== 'fetched';
}
*/

module.exports = {
  getFillSize: fillSize,

  getStrokeSize: function () {
    console.error('Not Implemented!');
  }
};
