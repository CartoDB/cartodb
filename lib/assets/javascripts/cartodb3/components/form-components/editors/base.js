var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var ESC_KEY_CODE = 27;

Backbone.Form.editors.Base = Backbone.Form.editors.Base.extend({

  _setOptions: function (opts) {
    var validators = [];

    if (this.options && this.options.validators) {
      validators = validators.concat(this.options.validators);
    }

    if (opts.schema && opts.schema.validators) {
      validators = validators.concat(opts.schema.validators);
    }

    this.validators = validators;

    this.options = _.extend(
      {},
      _.omit(this.options, 'validators') || {},
      opts.schema,
      // 'editorAttrs' can appear in schema if it comes from a Backbone form component
      // or in options directly if the component is created without a Backbone form
      opts.schema && opts.schema.editorAttrs || {},
      opts.editorAttrs,
      {
        keyAttr: opts.key
      },
      {
        validators: validators
      },
      _.omit(opts, 'validators')
    );
  },

  applyESCBind: function (callback) {
    this._ESCBindCallback = callback;
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  },

  _onKeyDown: function (ev) {
    if (ev.which === ESC_KEY_CODE) {
      this._ESCBindCallback();
    }
  },

  applyClickOutsideBind: function (callback) {
    this._clickBindCallback = callback;
    this.$el.attr('data-cid', this.cid);
    document.addEventListener('click', this._onDocumentClick.bind(this));
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);
    if ($el.closest('[data-cid="' + this.cid + '"]').length === 0) {
      this._clickBindCallback();
    }
  },

  remove: function () {
    if (this._ESCBindCallback) {
      document.removeEventListener('keydown', this._onKeyDown.bind(this));
    }
    if (this._clickBindCallback) {
      document.removeEventListener('click', this._onDocumentClick.bind(this));
    }
  }

});
