var _ = require('underscore');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var StyleConstants = require('builder/components/form-components/_constants/_style');

var NO_PANES_CLASS = 'Editor-formInner--NoTabs';

var DEFAULT_EDITOR_ATTRS = {
  help: {
    color: null,
    image: null
  },
  hidePanes: [],
  hideTabs: [],
  imageEnabled: false,
  categorizeColumns: false
};

module.exports = {
  generate: function (params) {
    var editorAttrs = _.clone(DEFAULT_EDITOR_ATTRS);

    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    editorAttrs.hidePanes = [];

    var styleType = params.queryGeometryModel.get('simple_geom') === StyleConstants.Type.POLYGON
      ? StyleConstants.Type.POLYGON
      : params.styleType;

    var geom = params.queryGeometryModel.get('simple_geom');
    var title = _t('editor.style.components.fillColor.' + geom) + ' ' + _t('editor.style.components.fillColor.label');

    editorAttrs.help.color = _t('editor.style.tooltips.fill.color', { type: _t('editor.style.tooltips.' + styleType) });

    if (params.styleType === StyleConstants.Type.HEATMAP) {
      editorAttrs.hidePanes = [FillConstants.Panes.FIXED];
    }

    if (params.styleType === StyleConstants.Type.SIMPLE && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      if (!params.isAutoStyleApplied) {
        editorAttrs.imageEnabled = true;
        editorAttrs.help.image = _t('editor.style.tooltips.fill.image', { type: _t('editor.style.tooltips.' + styleType) });
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

    return {
      type: 'FillColor',
      title: title,
      options: options,
      fieldClass: editorAttrs.hidePanes.length >= 1 ? NO_PANES_CLASS : '',
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
