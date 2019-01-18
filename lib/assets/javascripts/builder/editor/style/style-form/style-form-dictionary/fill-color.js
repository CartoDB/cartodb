var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var StyleConstants = require('builder/components/form-components/_constants/_style');

var NO_PANES_CLASS = 'Editor-formInner--NoTabs';

module.exports = {
  generate: function (params) {
    var editorAttrs = {
      help: {
        color: null,
        image: null
      },
      hidePanes: [],
      hideTabs: [],
      imageEnabled: false,
      hideNumericColumns: false,
      removeByValueCategory: false,
      categorizeColumns: false,
      geometryName: params.queryGeometryModel.get('simple_geom')
    };

    var options = StyleFormDictionaryHelpers.getOptionsByStyleType({
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      animationType: params.animationType
    });

    var styleType = this._getStyleType(params);

    if (styleType === StyleConstants.Type.REGIONS ||
      styleType === StyleConstants.Type.HEXABINS ||
      styleType === StyleConstants.Type.SQUARES) {
      editorAttrs.geometryName = 'polygon';
      editorAttrs.removeByValueCategory = true;
    }

    this._setColor(editorAttrs, styleType);
    this._setEditorAttributesForHeatmaps(params, editorAttrs, styleType);
    this._setEditorAttributesForPoints(params, editorAttrs, styleType);
    this._setEditorAttributesForAnimation(params, editorAttrs, styleType);

    return {
      type: 'FillColor',
      title: this._getTitle(params),
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
  },

  _getStyleType: function (params) {
    return params.queryGeometryModel.get('simple_geom') === StyleConstants.Type.POLYGON
      ? StyleConstants.Type.POLYGON
      : params.styleType;
  },

  _getTitle: function (params) {
    var geom = params.queryGeometryModel.get('simple_geom');
    return _t('editor.style.components.fillColor.' + geom) +
      ' ' +
      _t('editor.style.components.fillColor.label');
  },

  _setEditorAttributesForHeatmaps: function (params, editorAttrs, styleType) {
    if (styleType === StyleConstants.Type.HEATMAP) {
      editorAttrs.hidePanes = [FillConstants.Panes.FIXED];
      editorAttrs.help.color = _t('editor.style.tooltips.fill.color-heatmap');
    }
  },

  _setEditorAttributesForPoints: function (params, editorAttrs, styleType) {
    if (styleType === StyleConstants.Type.SIMPLE && StyleFormDictionaryHelpers.hasGeometryOf(params, 'point')) {
      if (!params.isAutoStyleApplied) {
        this._setImage(editorAttrs, styleType);
      }
    }
  },

  _setEditorAttributesForAnimation: function (params, editorAttrs, styleType) {
    if (styleType === StyleConstants.Type.ANIMATION) {
      editorAttrs.hideTabs = [FillConstants.Tabs.BINS, FillConstants.Tabs.QUANTIFICATION];
      editorAttrs.hideNumericColumns = true;

      if (params.animationType === 'simple') {
        editorAttrs.categorizeColumns = true;
      } else {
        editorAttrs.hidePanes = [FillConstants.Panes.FIXED];
        editorAttrs.help.color = _t('editor.style.tooltips.fill.color-heatmap');
      }
    }
  },

  _setColor: function (editorAttrs, styleType) {
    var tooltipColor = _t('editor.style.tooltips.fill.color', {
      type: _t('editor.style.tooltips.' + styleType)
    });

    editorAttrs.help.color = tooltipColor;
  },

  _setImage: function (editorAttrs, styleType) {
    editorAttrs.imageEnabled = true;
    editorAttrs.help.image = _t('editor.style.tooltips.fill.image', {
      type: _t('editor.style.tooltips.' + styleType)
    });
  }
};
