var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function (params) {
    if (params.queryGeometryModel.get('simple_geom') === 'line') {
      return this._buildLineStrokeSize(params);
    }
    return this._buildSimpleStrokeSize(params);
  },

  _buildLineStrokeSize: function (params) {
    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType
    });

    var self = this;
    var size = this._buildSize(params, {
      options: options,
      title: _t('editor.style.components.stroke-size.label'),
      editorAttrs: self._buildLineStrokeSizeAttrs(params)
    });

    return size;
  },

  _buildSimpleStrokeSize: function (params) {
    var self = this;
    var size = this._buildSize(params, {
      options: [],
      title: _t('editor.style.components.stroke-size.label'),
      editorAttrs: self._buildSimpleStrokeSizeAttrs(params)
    });
    size.fieldClass = 'Editor-formInner--NoTabs';

    return size;
  },

  _buildLineStrokeSizeAttrs: function (params) {
    var queryStatus = params.querySchemaModel.get('status');
    var isDisabled = queryStatus !== 'fetched';

    var sizeAttrs = {
      min: 0,
      max: 50,
      disabled: isDisabled,
      defaultRange: [1, 5]
    };

    return sizeAttrs;
  },

  _buildSimpleStrokeSizeAttrs: function (params) {
    // var geometryType = params.queryGeometryModel.get('simple_geom');
    var sizeAttrs = {
      min: 0,
      max: 10,
      step: 0.5,
      hidePanes: [FillConstants.Panes.BY_VALUE]
    };
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
      dialogMode: DialogConstants.Mode.FLOAT,
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
  }
};
