var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = {
  generate: function (params) {
    var editorAttrs = {};

    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var styleType = params.queryGeometryModel.get('simple_geom') === StyleConstants.Type.POLYGON
      ? StyleConstants.Type.POLYGON
      : params.styleType;

    var color = {
      help: _t('editor.style.tooltips.fill.color', { type: _t('editor.style.tooltips.' + styleType) })
    };

    var imageEnabled = false;
    var geom = params.queryGeometryModel.get('simple_geom');
    var title = _t('editor.style.components.fillColor.' + geom) + ' ' + _t('editor.style.components.fillColor.label');

    if (params.styleType === StyleConstants.Type.HEATMAP) {
      editorAttrs.hidePanes = [FillConstants.Panes.FIXED];
    }

    if (params.styleType === StyleConstants.Type.SIMPLE && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      if (!params.isAutoStyleApplied) {
        imageEnabled = true;
      }
    }

    if (params.styleType === StyleConstants.Type.ANIMATION) {
      editorAttrs.hideTabs = [FillConstants.Tabs.BINS, FillConstants.Tabs.QUANTIFICATION];

      if (params.animationType === 'simple') {
        editorAttrs.categorizeColumns = true;
      } else {
        editorAttrs.hidePanes = [FillConstants.Panes.FIXED];
      }
    }

    editorAttrs.color = color;
    editorAttrs.imageEnabled = imageEnabled;

    return {
      type: 'FillColor',
      title: title,
      options: options,
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      validators: ['required'],
      editorAttrs: editorAttrs,
      modals: params.modals,
      dialogMode: DialogConstants.Mode.FLOAT
    };
  }
};
