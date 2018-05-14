var _ = require('underscore');
var Backbone = require('backbone');

var tabPaneTemplate = require('builder/components/form-components/editors/size/size.tpl');
var createRadioLabelsTabPane = require('builder/components/tab-pane/create-radio-labels-tab-pane');

var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var InputSizeFixedContentView = require('./input-size-fixed-content-view');
// var InputSizeValueContentView = require('./input-size-value-content-view');

var DEFAULT_INPUT_MIN_VALUE = 0;
var DEFAULT_INPUT_MAX_VALUE = 100;
var DEFAULT_INPUT_STEP_VALUE = 1;

var FIXED = 'fixed';
var BY_VALUE = 'value';

Backbone.Form.editors.Size = Backbone.Form.editors.Base.extend({

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

    this.sizeModel = new Backbone.Model(this.model.get(opts.key));

    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    var self = this;
    this.sizeModel.bind('change', function () {
      self.model.set(self.key, self.sizeModel.toJSON());
    }, this);
  },

  _initViews: function () {
    var self = this;

    var fixedPane = {
      name: FIXED,
      selected: true,
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

    if (this.sizeModel.get('range') && this._tabPaneTabs.length > 1) {
      this._tabPaneTabs[1].selected = true;
    }

    this._tabPaneView = createRadioLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.listenTo(this._tabPaneView.collection, 'change:selected', this._onChangeTabPaneViewTab);
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
    var range = this.sizeModel.get('range');
    if (range) {
      // when coming from range calculate the average...
      var avg = 0.5 * (+range[0] + +range[1]);
      this.sizeModel.set('fixed', avg);
      this.sizeModel.unset('range');
    }
  },

  _updateRangeValue: function () {
    var fixed = this.sizeModel.get('fixed');
    if (fixed !== null && fixed !== undefined && this.sizeModel.get('attribute')) {
      var editorAttrs = this.options.editorAttrs;
      var range = (editorAttrs && editorAttrs.defaultRange) || [fixed, fixed];
      this.sizeModel.set('range', range);
      this.sizeModel.unset('fixed');
    }
  },

  _generateFixedContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    return new InputSizeFixedContentView({
      model: this.sizeModel,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE,
      step: (editorAttrs && editorAttrs.step) || DEFAULT_INPUT_STEP_VALUE
    });
  },

  _generateValueContentView: function () {
    /*
    var editorAttrs = this.options.editorAttrs;
    return new InputSizeValueContentView({
      model: this.sizeModel,
      columns: this._columns,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE
    });
    */
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
    return this.sizeModel.toJSON();
  },

  setValue: function (value) {
    //
  },

  remove: function () {
    // TODO ?
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
