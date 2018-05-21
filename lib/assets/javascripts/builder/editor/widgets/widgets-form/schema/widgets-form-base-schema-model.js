var _ = require('underscore');
var Backbone = require('backbone');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');

module.exports = Backbone.Model.extend({

  initialize: function (attrs, options) {
    var o = [
      {
        val: true,
        label: _t('editor.widgets.widgets-form.style.yes')
      }, {
        val: false,
        label: _t('editor.widgets.widgets-form.style.no')
      }
    ];
    this.schema = {
      sync_on_bbox_change: {
        type: 'Radio',
        title: _t('editor.widgets.widgets-form.style.sync_on_bbox_change'),
        options: o
      }
    };
  },

  _addAllStyleSchemaAttributes: function () {
    var customType = this.get('type') === 'category' ? 'categories' : 'ramp';
    var styleAttrs = {
      widget_style_definition: {
        type: 'Fill',
        title: _t('editor.widgets.widgets-form.style.fill'),
        options: [],
        configModel: this._configModel,
        modals: this._modals,
        userModel: this._userModel,
        dialogMode: DialogConstants.Mode.FLOAT,
        editorAttrs: {
          color: {
            hidePanes: [FillConstants.Panes.BY_VALUE],
            disableOpacity: true
          }
        }
      }
    };

    if (this.get('auto_style_allowed')) {
      var editorAttrs = {
        color: {
          hidePanes: [FillConstants.Panes.FIXED]
        }
      };

      if (customType === 'categories') {
        editorAttrs.color.hideTabs = [
          FillConstants.Tabs.BINS,
          FillConstants.Tabs.QUANTIFICATION
        ];
      }

      styleAttrs = _.extend(styleAttrs, {
        auto_style_definition: {
          type: 'EnablerEditor',
          title: '',
          label: _t('editor.widgets.widgets-form.style.custom-colors'),
          help: _t('editor.widgets.widgets-form.style.custom-help'),
          editor: {
            type: 'Fill',
            title: '',
            options: [this.get('column')],
            dialogMode: DialogConstants.Mode.FLOAT,
            query: 'query',
            configModel: this._configModel,
            modals: this._modals,
            userModel: this._userModel,
            editorAttrs: editorAttrs
          }
        }
      });
    } else {
      styleAttrs = _.extend(styleAttrs, {
        auto_style_definition: {
          type: 'Text',
          title: _t('editor.widgets.widgets-form.style.custom-colors'),
          help: _t('editor.widgets.widgets-form.style.custom-disabled'),
          disabled: true
        }
      });
    }

    this.schema = _.extend(this.schema, styleAttrs);
  },

  parse: function (r) {
    var attrs = _.defaults(
      {
        sync_on_bbox_change: r.sync_on_bbox_change ? 'true' : 'false'
      },
      r
    );
    return attrs;
  },

  changeWidgetDefinitionModel: function (widgetDefinitionModel) {
    var attrs = _.defaults(
      {
        sync_on_bbox_change: this.get('sync_on_bbox_change') === 'true'
      },
      this._prepareAttributesForWidgetDefinition()
    );

    if (attrs.auto_style_definition !== '' && _.isEmpty(attrs.auto_style_definition)) {
      attrs.auto_style_definition = WidgetDefinitionModel.getDefaultAutoStyle(widgetDefinitionModel.get('type'), widgetDefinitionModel.get('column'));
    }

    widgetDefinitionModel.set(attrs);
  },

  _prepareAttributesForWidgetDefinition: function () {
    return this.attributes;
  }
});
