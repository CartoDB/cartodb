var _ = require('underscore');

var DEFAULT_SIZE = {
  min: 1,
  max: 45,
  step: 0.5
};

function getPointSize (params, options) {
  var size = buildSize(params, {
    options: options,
    title: '* ' + _t('editor.style.components.point-size.label'),
    editorAttrs: buildEditorAttrsForPointSize(params)
  });
  return size;
}

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

  if (customOptions) {
    size = _.extend(size, customOptions);
  }

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
  var size = _.extend({}, DEFAULT_SIZE);
  // help: _t('editor.style.tooltips.fill.size', {type: _t('editor.style.tooltips.' + params.styleType)})
  if (params.styleType === 'simple') size.defaultRange = [5, 20];
  hideByValuePaneIfNotAllowed(params, size);
  return size;
}

function hideByValuePaneIfNotAllowed (params, size) {
  if (_.contains(['heatmap', 'animation'], params.styleType)) {
    size.hidePanes = ['value'];
  }
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

module.exports = {
  getFillSize: function (params, options) {
    var geometryType = params.queryGeometryModel.get('simple_geom');

    switch (geometryType) {
      case 'point':
        return getPointSize(params, options);
      default:
        throw Error('Not implemented!'); // TODO do we cover all the cases (eg. multi-line...)?
    }
  }

  /*
  getStrokeSize: function (params, options) {
    return getSize(params, options, STROKE);
  }
  */
};
