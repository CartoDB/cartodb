var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/helpers/editor');

var FillColorFixedView = require('builder/components/form-components/editors/fill-color/fill-color-fixed-view');
var FillColorByValueView = require('builder/components/form-components/editors/fill-color/fill-color-by-value-view');

var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var tabPaneTemplate = require('builder/components/tab-pane/tab-pane.tpl');
var createRadioLabelsTabPane = require('builder/components/tab-pane/create-radio-labels-tab-pane');

Backbone.Form.editors.FillColor = Backbone.Form.editors.Base.extend({
  className: 'Form-InputFill Editor-formInput--FillColor',

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    if (this.options.editorAttrs) {
      this.options = _.extend(this.options, {
        columns: this.options.options,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        editorAttrs: this.options.editorAttrs,
        modals: this.options.modals
      });

      this._colorKeyAttribute = options.key;
      this._colorAttributes = this.model.get(this._colorKeyAttribute);
      this._sizeAttributes = this.model.get('fillSize');

      this._imageInputModel = new Backbone.Model(
        _.extend({ type: 'image' }, this._colorAttributes)
      );

      this._fixedColorInputModel = new Backbone.Model(
        _.extend({ type: 'color' }, this._colorAttributes)
      );

      this._valueColorInputModel = new Backbone.Model(
        _.extend({ type: 'color' }, this._colorAttributes)
      );
    }

    this._initViews();
  },

  _initViews: function () {
    var self = this;
    var geometryName = this.options.editorAttrs.geometryName;

    var fixedPane = {
      name: FillConstants.Panes.FIXED,
      label: _t('form-components.editors.fill.input-number.solid'),
      tooltip: _t('editor.style.tooltips.fill.fixed-tab', { type: geometryName }),
      tooltipGravity: 's',
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var valuePane = {
      name: FillConstants.Panes.BY_VALUE,
      label: _t('form-components.editors.fill.input-number.by-value'),
      tooltip: _t('editor.style.tooltips.fill.by-value-tab', { type: geometryName }),
      tooltipGravity: 's',
      createContentView: function () {
        return self._generateValueContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      var hidePanes = this.options.editorAttrs.hidePanes;

      if (!_.contains(hidePanes, FillConstants.Panes.FIXED)) {
        this._tabPaneTabs.push(fixedPane);
      }

      if (!_.contains(hidePanes, FillConstants.Panes.BY_VALUE)) {
        this._tabPaneTabs.push(valuePane);
      }
    } else {
      this._tabPaneTabs = [fixedPane, valuePane];
    }

    var tabPaneOptions = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'div',
        className: 'CDB-Text CDB-Size-medium'
      }
    };

    var selectedTabPaneIndex = this._getSelectedTabPaneIndex();
    this._tabPaneTabs[selectedTabPaneIndex].selected = true;

    this._tabPaneView = createRadioLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.$el.append(this._tabPaneView.render().$el);
  },

  _getSelectedTabPaneIndex: function () {
    var FIXED_TAB_PANE_INDEX = 0;
    var VALUE_TAB_PANE_INDEX = 1;

    return this._colorAttributes && this._colorAttributes.range &&
      this._tabPaneTabs.length > 1
      ? VALUE_TAB_PANE_INDEX
      : FIXED_TAB_PANE_INDEX;
  },

  _removeDialogs: function () {
    this._removeFillColorFixedDialog();
    this._removeFillColorByValueDialog();
  },

  _removeFillColorFixedDialog: function () {
    this._fillColorFixedView && this._fillColorFixedView.removeDialog();
  },

  _removeFillColorByValueDialog: function () {
    this._fillColorByValueView && this._fillColorByValueView.removeDialog();
  },

  _generateFixedContentView: function () {
    this._fillColorFixedView = new FillColorFixedView({
      model: this.model,
      columns: this.options.columns,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      query: this.options.query,
      editorAttrs: this.options.editorAttrs,
      dialogMode: DialogConstants.Mode.FLOAT,
      hideTabs: this.options.hideTabs,
      fixedColorInputModel: this._fixedColorInputModel,
      imageInputModel: this._imageInputModel,
      popupConfig: {
        cid: this.cid,
        $el: this.$el
      }
    });

    this.applyESCBind(this._removeFillColorFixedDialog);
    this.applyClickOutsideBind(this._removeFillColorFixedDialog);

    this._fillColorFixedView.on('onInputChanged', function (input) {
      this.trigger('change', input);
    }, this);

    return this._fillColorFixedView;
  },

  _generateValueContentView: function () {
    this._fillColorByValueView = new FillColorByValueView({
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs,
      model: this.model,
      dialogMode: DialogConstants.Mode.FLOAT,
      categorizeColumns: this.options.categorizeColumns,
      hideNumericColumns: this.options.hideNumericColumns,
      removeByValueCategory: this.options.removeByValueCategory,
      modals: this.options.modals,
      hideTabs: this.options.hideTabs,
      valueColorInputModel: this._valueColorInputModel,
      popupConfig: {
        cid: this.cid,
        $el: this.$el
      }
    });

    this.applyESCBind(this._removeFillColorByValueDialog);
    this.applyClickOutsideBind(this._removeFillColorByValueDialog);

    this._fillColorByValueView.on('onInputChanged', function (input) {
      this.trigger('change', input);
    }, this);

    return this._fillColorByValueView;
  },

  getValue: function (param) {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    return selectedTabPaneName === FillConstants.Panes.FIXED
      ? this._getFillFixedValues()
      : this._getFillByValueValues();
  },

  _getFillFixedValues: function () {
    var color = this._fixedColorInputModel.toJSON();
    var image = this._imageInputModel.toJSON();

    if (color.range) {
      color.fixed = color.range[0];
      color.opacity = 1;
    }

    var colorOmitAttributes = [
      'createContentView',
      'selected',
      'type',
      'image',
      'marker',
      'range'
    ];

    var imageOmitAttributes = [
      'createContentView',
      'selected',
      'type',
      'fixed',
      'range'
    ];

    var colorAttributes = _.omit(color, colorOmitAttributes);
    var imageAttributes = _.omit(image, imageOmitAttributes);
    var values = _.extend({}, imageAttributes, colorAttributes);

    this._fixedColorInputModel.set(values);
    this._imageInputModel.set(values);

    return values;
  },

  _getFillByValueValues: function () {
    var colorOmitAttributes = [
      'createContentView',
      'selected',
      'type'
    ];

    var values = _.omit(this._valueColorInputModel.toJSON(), colorOmitAttributes);

    this._valueColorInputModel.set(values);

    return values;
  },

  remove: function () {
    this._removeDialogs();
    this._tabPaneView.clean();
    this._fillColorByValueView && this._fillColorByValueView.clean();
    this._fillColorFixedView && this._fillColorFixedView.clean();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
