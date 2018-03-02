const _ = require('underscore');
const Backbone = require('backbone');
const template = require('./multi-checkbox.tpl');
const EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

Backbone.Form.editors.MultiCheckbox = Backbone.Form.editors.Base.extend({
  events: {
    'click .js-checkbox': '_onCheckboxClick'
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this._initViews();
  },

  validate: function () {
    const requiredError = {
      type: 'required',
      message: 'Required'
    };

    return this._hasValue() ? null : requiredError;
  },

  _initViews: function () {
    this.$el.html(
      template({
        disabled: this.options.editorAttrs.disabled,
        inputs: this.options.inputs,
        values: this.value
      })
    );
  },

  _onCheckboxClick: function (event) {
    const { name, checked } = event.target;
    const newValue = { ...this.getValue(), [name]: checked };

    this.setValue(newValue);
    this.trigger('change', this);
  },

  _hasValue: function () {
    return _.some(_.values(this.value));
  }
});
