var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var _ = require('underscore');
var $ = require('jquery');
var OperatorListView = require('./operators-list-view');
var OperatorListCollection = require('./operators-list-collection');
var template = require('./operators.tpl');
var PopupManager = require('builder/components/popup-manager');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Operators = Backbone.Form.editors.Base.extend({

  tagName: 'div',
  className: 'Editor-formSelect u-ellipsis',

  events: {
    'click .js-button': '_onButtonClick',
    'keydown .js-button': '_onButtonKeyDown',
    'focus .js-button': function () {
      this.trigger('focus', this);
    },
    'blur': function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.collection = new OperatorListCollection(this.options.options);
    this.dialogMode = this.options.dialogMode || 'nested';

    if (this.options.editorAttrs && this.options.editorAttrs.help) {
      this._help = this.options.editorAttrs.help;
    }

    this._initViews();
    this.setValue(this.model.get(this.options.keyAttr));
    this._initBinds();
  },

  _initViews: function () {
    var value = this.model.get(this.options.keyAttr);

    this.$el.append(
      $('<div>').addClass('js-operator')
    );

    this._setOperatorTemplate();

    this._operatorsListView = new OperatorListView({
      operator: value.operator,
      attribute: value.attribute,
      collection: this.collection
    });
    this._operatorsListView.bind('change', this._onOperatorsChange, this);

    this._popupManager = new PopupManager(this.cid, this.$el, this._operatorsListView.$el);
    this._popupManager.append(this.dialogMode);

    if (this.options.disabled) {
      this.undelegateEvents();
    }
  },

  _setOperatorTemplate: function () {
    this.$('.js-operator').html(
      template({
        name: this._getOperatorsTextValue(),
        disabled: this.options.disabled,
        keyAttr: this.options.keyAttr,
        help: this._help || ''
      })
    );

    if (this._help) {
      this._removeTooltip();

      this._helpTooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 'w',
        title: function () {
          return $(this).data('tooltip');
        }
      });
    }
  },

  _initBinds: function () {
    var hide = function () {
      this._operatorsListView.hide();
      this._popupManager.untrack();
    }.bind(this);

    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);
  },

  _onOperatorsChange: function (data) {
    this.model.set(this.options.keyAttr, data);
    this._setOperatorTemplate();
    this.$('.js-button').focus();
    this.trigger('change', this);
  },

  _getOperatorsTextValue: function () {
    var value = this.model.get(this.options.keyAttr);
    if (value && value.operator) {
      return value.operator.toUpperCase() + (value.attribute ? '(' + value.attribute + ')' : '');
    } else {
      return '';
    }
  },

  _onButtonClick: function (ev) {
    this._operatorsListView.toggle();
    this._operatorsListView.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._operatorsListView.isVisible()) {
        ev.stopPropagation();
        this._operatorsListView.toggle();
        this._popupManager.track();
      } else {
        this._popupManager.untrack();
      }
    }
  },

  getValue: function () {
    var data = this.model.get(this.options.keyAttr);
    return _.omit(data, 'visible');
  },

  setValue: function (value) {
    var textValue = this._getOperatorsTextValue();
    this.value = textValue;
    this._setOperatorTemplate();
  },

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  remove: function () {
    this._removeTooltip();

    this._popupManager && this._popupManager.destroy();
    this._operatorsListView && this._operatorsListView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
