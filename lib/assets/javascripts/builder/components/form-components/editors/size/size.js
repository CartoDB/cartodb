var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

// WIP
Backbone.Form.editors.Size = Backbone.Form.editors.Base.extend({
  // className: 'Form-InputFill CDB-OptionInput CDB-Text js-input', // TODO

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
    EditorHelpers.setOptions(this, opts); // Options

    this.options = _.extend(
      this.options,
      {
        columns: this.options.options,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        editorAttrs: this.options.editorAttrs,
        modals: this.options.modals
      }
    );

    this._keyAttr = opts.key;
    // this.dialogMode = this.options.dialogMode || 'nested';

    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    // TODO
  },

  _initViews: function () {
    // TODO
  },

  focus: function () {
    // TODO
  },

  blur: function () {
    // TODO
  },

  getValue: function () {
    // TODO
  },

  setValue: function (value) {
    // TODO
  },

  remove: function () {
    // TODO
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
