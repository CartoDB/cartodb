var Backbone = require('backbone');
var _ = require('underscore');
var OperatorListView = require('./operators-list-view');
var OperatorListCollection = require('./operators-list-collection');
var template = require('./operators.tpl');
var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Operators = Backbone.Form.editors.Base.extend({

  tagName: 'div',
  className: '',

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
    this.options = _.extend(
      {},
      opts.schema.editorAttrs || {},
      {
        keyAttr: opts.key
      }
    );

    this.collection = new OperatorListCollection(opts.schema.options);
    this._initViews();
    this.setValue(this.model.get(this.options.keyAttr));
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initBinds();
  },

  _initViews: function () {
    var value = this.model.get(this.options.keyAttr);
    this.$el.html(
      template({
        name: this._getOperatorsTextValue(),
        disabled: this.options.disabled
      })
    );

    if (this.options.disabled) {
      this.undelegateEvents();
    }

    this._operatorsListView = new OperatorListView({
      operator: value.operator,
      attribute: value.attribute,
      collection: this.collection,
      model: this.model
    });
    this.$el.append(this._operatorsListView.el); // No render from the beginning
  },

  _initBinds: function () {
    this._operatorsListView.bind('change', this._onOperatorsChange, this);

    this.applyESCBind(function () {
      this._operatorsListView.hide();
    });
    this.applyClickOutsideBind(function () {
      this._operatorsListView.hide();
    });
  },

  _onOperatorsChange: function (data) {
    this.model.set(this.options.keyAttr, data);
    this.$('.js-button')
      .text(this._getOperatorsTextValue())
      .focus();
    this.trigger('change', this);
  },

  _getOperatorsTextValue: function () {
    var value = this.model.get(this.options.keyAttr);
    return value.operator.toUpperCase() + (value.attribute ? '(' + value.attribute + ')' : '');
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
    return this.model.get(this.options.keyAttr);
  },

  setValue: function (value) {
    var textValue = this._getOperatorsTextValue();
    this.$('.js-button').text(textValue);
    this.value = textValue;
  },

  remove: function () {
    this._operatorsListView && this._operatorsListView.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
