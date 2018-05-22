var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = {
  generate: function (params) {
    var strokeParams = {
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals
    };

    return params.queryGeometryModel.get('simple_geom') === 'line'
      ? this._generateLineStrokeColor(strokeParams)
      : this._generateSimpleStrokeColor(strokeParams, params.queryGeometryModel.get('simple_geom'));
  },

  _generateLineStrokeColor: function (params) {
    if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!params.configModel) throw new Error('configModel is required');
    if (!params.styleType) throw new Error('styleType is required');
    if (!params.userModel) throw new Error('userModel is required');
    if (!params.modals) throw new Error('modals is required');

    var queryStatus = params.querySchemaModel.get('status');
    var isDisabled = queryStatus !== 'fetched';
    var helpMessage = _t('editor.style.components.stroke.' + queryStatus);

    return {
      type: 'StrokeColor',
      title: _t('editor.style.components.stroke.label'),
      options: StyleFormDictionaryHelpers.getOptionsByStyleType({
        querySchemaModel: params.querySchemaModel,
        styleType: params.styleType
      }),
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals,
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        min: 0,
        max: 50,
        disabled: isDisabled,
        help: isDisabled ? helpMessage : _t('editor.style.tooltips.stroke.color', { type: _t('editor.style.tooltips.line') })
      },
      validators: ['required']
    };
  },

  _generateSimpleStrokeColor: function (params, type) {
    if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!params.configModel) throw new Error('configModel is required');
    if (!params.styleType) throw new Error('styleType is required');
    if (!params.userModel) throw new Error('userModel is required');
    if (!params.modals) throw new Error('modals is required');

    var styleType = type === StyleConstants.Type.POLYGON
      ? StyleConstants.Type.POLYGON
      : params.styleType;

    return {
      type: 'StrokeColor',
      title: _t('editor.style.components.stroke-color.label'),
      options: [],
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals,
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        help: _t('editor.style.tooltips.stroke.color', { type: _t('editor.style.tooltips.' + styleType) })
      },
      validators: ['required']
    };
  }
};
