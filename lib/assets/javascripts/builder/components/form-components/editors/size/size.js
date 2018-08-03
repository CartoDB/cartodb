var _ = require('underscore');
var Backbone = require('backbone');

var tabPaneTemplate = require('builder/components/tab-pane/tab-pane.tpl');
var createRadioLabelsTabPane = require('builder/components/tab-pane/create-radio-labels-tab-pane');

var EditorHelpers = require('builder/components/form-components/helpers/editor');

var SizeFixedView = require('./size-fixed-view');
var SizeByValueView = require('./size-by-value-view');

var FillConstants = require('builder/components/form-components/_constants/_fill');

Backbone.Form.editors.Size = Backbone.Form.editors.Base.extend({
  className: 'Form-InputSize CDB-Text',

  events: {
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this._sizeModel = new Backbone.Model(this.model.get(opts.key));

    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    this._updateSizeModelOnChangeBind();
    this.applyESCBind(this._removeDialogs);
    this.applyClickOutsideBind(this._removeDialogs);
  },

  _updateSizeModelOnChangeBind: function () {
    var self = this;
    this._sizeModel.bind('change', function () {
      self.model.set(self.key, self._sizeModel.toJSON());
    }, this);
  },

  _removeDialogs: function () {
    this._valueView && this._valueView.removeDialog();
  },

  _removePopupManagers: function () {
    this._valueView && this._valueView.removePopupManager();
  },

  _initViews: function () {
    this._tabPaneTabs = this._getTabPanes();

    this._setSelectedTab();

    this._tabPaneView = createRadioLabelsTabPane(
      this._tabPaneTabs,
      this._getTabPaneOptions()
    );

    this.listenTo(
      this._tabPaneView.collection,
      'change:selected',
      this._onChangeTabPaneViewTab
    );

    this.$el.append(this._tabPaneView.render().$el);
  },

  _getTabPanes: function () {
    var tabPaneTabs = [];
    var attrs = this.options.editorAttrs;
    if (attrs && attrs.hidePanes) {
      if (!_.contains(attrs.hidePanes, FillConstants.Panes.FIXED)) tabPaneTabs.push(this._buildFixedPane());
      if (!_.contains(attrs.hidePanes, FillConstants.Panes.BY_VALUE)) tabPaneTabs.push(this._buildByValuePane());
    } else {
      tabPaneTabs = [this._buildFixedPane(), this._buildByValuePane()];
    }
    return tabPaneTabs;
  },

  _setSelectedTab: function () {
    var selectedIndex = this._getSelectedTabPaneIndex();
    this._tabPaneTabs[selectedIndex].selected = true;
  },

  _getTabPaneOptions: function () {
    var options = {
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
    return options;
  },

  _buildFixedPane: function () {
    var self = this;
    var geometryName = this.options.editorAttrs.geometryName;
    var fixedPane = {
      name: FillConstants.Panes.FIXED,
      label: _t('form-components.editors.fill.input-number.fixed'),
      tooltip: _t('editor.style.tooltips.size.fixed-tab', { type: geometryName }),
      tooltipGravity: 's',
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };
    return fixedPane;
  },

  _buildByValuePane: function () {
    var self = this;
    var geometryName = this.options.editorAttrs.geometryName;
    var valuePane = {
      name: FillConstants.Panes.BY_VALUE,
      label: _t('form-components.editors.fill.input-number.by-value'),
      tooltip: _t('editor.style.tooltips.size.by-value-tab', { type: geometryName }),
      tooltipGravity: 's',
      createContentView: function () {
        return self._generateByValueContentView();
      }
    };
    return valuePane;
  },

  _getSelectedTabPaneIndex: function () {
    var FIXED_TAB_PANE = 0;
    var BY_VALUE_PANE = 1;

    var hasRange = this._sizeModel.get('range');
    var thereIsByValuePane = this._tabPaneTabs.length > 1;

    return hasRange && thereIsByValuePane ? BY_VALUE_PANE : FIXED_TAB_PANE;
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    if (selectedTabPaneName === FillConstants.Panes.FIXED) {
      this._updateFixedValue();
    } else {
      this._updateRangeValue();
    }

    this.trigger('change', selectedTabPaneName, this);
  },

  _updateFixedValue: function () {
    var range = this._sizeModel.get('range');
    if (range) {
      // when coming from range calculate the average...
      var avg = 0.5 * (+range[0] + +range[1]);
      this._sizeModel.set('fixed', avg);
      this._sizeModel.unset('range');
    }
  },

  _updateRangeValue: function () {
    var fixed = this._sizeModel.get('fixed');
    if (
      fixed !== null &&
      !_.isUndefined(fixed) &&
      this._sizeModel.get('attribute')
    ) {
      var editorAttrs = this.options.editorAttrs;
      var range = editorAttrs && editorAttrs.defaultRange || [fixed, fixed];
      this._sizeModel.set('range', range);
      this._sizeModel.unset('fixed');
    }
  },

  _generateFixedContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    this._fixedView = new SizeFixedView({
      model: this._sizeModel,
      min: editorAttrs && editorAttrs.min || FillConstants.Size.DefaultInput100.MIN,
      max: editorAttrs && editorAttrs.max || FillConstants.Size.DefaultInput100.MAX,
      step: editorAttrs && editorAttrs.step || FillConstants.Size.DefaultInput100.STEP
    });
    return this._fixedView;
  },

  _generateByValueContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    this._valueView = new SizeByValueView({
      model: this._sizeModel,
      columns: this.schema.options,
      min: editorAttrs && editorAttrs.min || FillConstants.Size.DefaultInput100.MIN,
      max: editorAttrs && editorAttrs.max || FillConstants.Size.DefaultInput100.MAX,
      popupConfig: {
        cid: this.cid,
        $el: this.$el,
        mode: this.options.dialogMode
      }
    });
    return this._valueView;
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$('.js-menu').focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$('.js-menu').blur();
  },

  getValue: function () {
    return this._sizeModel.toJSON();
  },

  remove: function () {
    this._removeDialogs();
    this._removePopupManagers();
    this._tabPaneView.clean();
    this._valueView && this._valueView.clean();
    this._fixedView && this._fixedView.clean();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
