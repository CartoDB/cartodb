var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

var DEFAULT_SIZE = {
  min: 1,
  max: 45,
  step: 0.5
};

module.exports = {
  generate: function (params) {
    var optionsForStyle = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var size = this._buildFillSize(params, optionsForStyle);
    return size;
  },

  _buildFillSize: function (params, optionsForStyle) {
    var self = this;
    var size = this._buildSize(params, {
      options: optionsForStyle,
      title: _t('editor.style.components.point-size.label'), // TODO: add resource at en.json for each one
      editorAttrs: self._buildFillSizeAttrs(params)
    });

    this._hideByValuePaneIfNeeded(params, size);
    return size;
  },

  _buildFillSizeAttrs: function (params) {
    var sizeAttrs = _.extend({}, DEFAULT_SIZE);
    this._setDefaultRangeIfNeeded(params, sizeAttrs);
    return sizeAttrs;
  },

  _buildSize: function (params, customOptions) {
    this._checkForParams(params);

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
  },

  _checkForParams: function (params) {
    if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!params.configModel) throw new Error('configModel is required');
    if (!params.styleType) throw new Error('styleType is required');
    if (!params.userModel) throw new Error('userModel is required');
    if (!params.modals) throw new Error('modals is required');
  },

  _setDefaultRangeIfNeeded: function (params, sizeAttrs) {
    if (params.styleType === 'simple' && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      sizeAttrs.defaultRange = [5, 20];
    }
  },

  _hideByValuePaneIfNeeded: function (params, size) {
    if (_.contains(['heatmap', 'animation'], params.styleType)) {
      size.editorAttrs.hidePanes = ['value'];
      size.fieldClass = 'Editor-formInner--NoTabs';
    }
  }
};
