var _ = require('underscore');
var Backbone = require('backbone');

var tabPaneTemplate = require('builder/components/form-components/editors/style-common/tabs.tpl');
var createRadioLabelsTabPane = require('builder/components/tab-pane/create-radio-labels-tab-pane');

var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var SizeFixedView = require('./size-fixed-view');
var SizeValueView = require('./size-value-view');

var DEFAULT_INPUT_MIN_VALUE = 0;
var DEFAULT_INPUT_MAX_VALUE = 100;
var DEFAULT_INPUT_STEP_VALUE = 1;

var FIXED = 'fixed';
var BY_VALUE = 'value';

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

    this._columns = opts.schema.options;
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
    var self = this;

    var fixedPane = {
      name: FIXED,
      label: _t('form-components.editors.fill.input-number.fixed'),
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var valuePane = {
      name: BY_VALUE,
      label: _t('form-components.editors.fill.input-number.value'),
      createContentView: function () {
        return self._generateValueContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      var hidePanes = this.options.editorAttrs.hidePanes;
      if (!_.contains(hidePanes, FIXED)) {
        this._tabPaneTabs.push(fixedPane);
      }
      if (!_.contains(hidePanes, BY_VALUE)) {
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

    if (this._sizeModel.get('range') && this._tabPaneTabs.length > 1) {
      this._tabPaneTabs[1].selected = true;
    }

    this._tabPaneView = createRadioLabelsTabPane(
      this._tabPaneTabs,
      tabPaneOptions
    );
    this.listenTo(
      this._tabPaneView.collection,
      'change:selected',
      this._onChangeTabPaneViewTab
    );
    this.$el.append(this._tabPaneView.render().$el);
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    if (selectedTabPaneName === FIXED) {
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
      fixed !== undefined &&
      this._sizeModel.get('attribute')
    ) {
      var editorAttrs = this.options.editorAttrs;
      var range = (editorAttrs && editorAttrs.defaultRange) || [fixed, fixed];
      this._sizeModel.set('range', range);
      this._sizeModel.unset('fixed');
    }
  },

  _generateFixedContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    this._fixedView = new SizeFixedView({
      model: this._sizeModel,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE,
      step: (editorAttrs && editorAttrs.step) || DEFAULT_INPUT_STEP_VALUE
    });
    return this._fixedView;
  },

  _generateValueContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    this._valueView = new SizeValueView({
      model: this._sizeModel,
      columns: this._columns,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE,
      popupConfig: {
        cid: this.cid,
        $el: this.$el
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

  setValue: function (value) {
    //
  },

  remove: function () {
    this._removeDialogs();
    this._removePopupManagers();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
