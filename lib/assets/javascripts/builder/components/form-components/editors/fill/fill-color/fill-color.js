var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var FillColorSolidView = require('builder/components/form-components/editors/fill/fill-color/fill-color-solid-view');
var FillColorByValueView = require('builder/components/form-components/editors/fill/fill-color/fill-color-by-value-view');

var tabPaneTemplate = require('builder/components/form-components/editors/style-common/tabs.tpl');
var createRadioLabelsTabPane = require('builder/components/tab-pane/create-radio-labels-tab-pane');

var SOLID = 'solid';
var BY_VALUE = 'value';

Backbone.Form.editors.FillColor = Backbone.Form.editors.Base.extend({
  className: 'Form-InputFillColor',

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    this.options = _.extend(this.options, {
      columns: this.options.options,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs,
      modals: this.options.modals
    });

    this.dialogMode = this.options.dialogMode || 'nested';

    this._initViews();
  },

  _initViews: function () {
    var self = this;

    var solidPane = {
      name: SOLID,
      selected: true,
      label: _t('form-components.editors.fill.input-number.' + SOLID),
      createContentView: function () {
        return self._generateSolidContentView();
      }
    };

    var valuePane = {
      name: BY_VALUE,
      label: _t('form-components.editors.fill.input-number.' + BY_VALUE),
      createContentView: function () {
        return self._generateValueContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      var hidePanes = this.options.editorAttrs.hidePanes;
      if (!_.contains(hidePanes, SOLID)) {
        this._tabPaneTabs.push(solidPane);
      }
      if (!_.contains(hidePanes, BY_VALUE)) {
        this._tabPaneTabs.push(valuePane);
      }
    } else {
      this._tabPaneTabs = [solidPane, valuePane];
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

    this._tabPaneTabs[0].selected = true; // FIXME

    this._tabPaneView = createRadioLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.listenTo(this._tabPaneView.collection, 'change:selected', this._onChangeTabPaneViewTab);
    this.$el.append(this._tabPaneView.render().$el);
  },

  _initRemoveDialogBinds: function () {
    this.applyESCBind(this._removeDialog);
    this.applyClickOutsideBind(this._removeDialog);
  },

  _removeDialog: function () {
    this._fillColorSolidView.removeDialog();
  },

  _generateSolidContentView: function () {
    var colorAttributes = _.clone(this.model.get(this.key));

    this._fillColorSolidView = new FillColorSolidView({
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs,
      modals: this.options.modals,
      dialogMode: this.options.dialogMode,
      colorAttributes: colorAttributes
    });

    this._initRemoveDialogBinds();

    this._fillColorSolidView.on('onInputChanged', function (input) {
      this.trigger('change', input);
    }, this);

    return this._fillColorSolidView;
  },

  _generateValueContentView: function () {
    this._fillColorByValueView = new FillColorByValueView({
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs
    });

    return this._fillColorByValueView;
  },

  getValue: function (param) {
    return this._fillColorSolidView._inputCollection.getValues();
  },

  setValue: function (value) {
    // TODO: add setter
  },

  remove: function () {
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
