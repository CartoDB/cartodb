var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var OperatorListView = require('./operators-list-view');
var OperatorListCollection = require('./operators-list-collection');
var template = require('./operators.tpl');
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
    this._setOptions(opts);

    this.collection = new OperatorListCollection(this.options.options);

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
    this.$el.append(this._operatorsListView.el); // No render from the beginning

    if (this.options.disabled) {
      this.undelegateEvents();
    }
  },

  _setOperatorTemplate: function () {
    this.$('.js-operator').html(
      template({
        name: this._getOperatorsTextValue(),
        disabled: this.options.disabled,
        keyAttr: this.options.keyAttr
      })
    );
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._operatorsListView.hide();
    });
    this.applyClickOutsideBind(function () {
      this._operatorsListView.hide();
    });
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
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._operatorsListView.isVisible()) {
        ev.stopPropagation();
        this._operatorsListView.toggle();
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

  remove: function () {
    this._operatorsListView && this._operatorsListView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
