var _ = require('underscore');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

var NO_PANES_CLASS = 'Editor-formInner--NoTabs';

module.exports = {
  generate: function (params) {
    this._checkForParams(params);

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
    size.fieldClass = NO_PANES_CLASS;

    return size;
  },

  _buildLineStrokeSizeAttrs: function (params) {
    var queryStatus = params.querySchemaModel.get('status');
    var isDisabled = queryStatus !== 'fetched';

    var sizeAttrs = {
      min: 0,
      max: 50,
      disabled: isDisabled,
      defaultRange: [1, 5],
      help: '',
      geometryName: params.queryGeometryModel.get('simple_geom')
    };

    return sizeAttrs;
  },

  _buildSimpleStrokeSizeAttrs: function (params) {
    var sizeAttrs = {
      min: 0,
      max: 10,
      step: 0.5,
      hidePanes: [FillConstants.Panes.BY_VALUE],
      help: 'editor.style.tooltips.stroke.size',
      geometryName: params.queryGeometryModel.get('simple_geom')
    };
    return sizeAttrs;
  },

  _buildSize: function (params, customOptions) {
    var size = {
      type: 'Size',
      dialogMode: DialogConstants.Mode.FLOAT,
      validators: ['required']
    };
    return _.extend(size, customOptions);
  },

  _checkForParams: function (params) {
    if (!params.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!params.styleType) throw new Error('styleType is required');
  }
};
