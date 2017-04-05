var $ = require('jquery');
var Backbone = require('backbone');
var FactoryHints = require('../../../editor/editor-hints/factory-hints');
var CodeMirrorView = require('../../code-mirror/code-mirror-view');

Backbone.Form.editors.TextArea = Backbone.Form.editors.Text.extend({
  tagName: 'textarea',

  className: 'CDB-Textarea',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts); // Options


    this.value = this.model.get(this.options.keyAttr);
  },

  render: function () {
    this.setValue(this.value);

    if (this.options.editor) {
      this._codemirrorModel = new Backbone.Model({
        content: this.value,
        readonly: false,
        lineNumbers: false
      });

      FactoryHints.init({
        tokens: this.options.tokens,
        tableName: false,
        columnsName: false
      });

      this._initViews();
    }

    this._toggleDisableState();

    return this;
  },

  getValue: function () {
    var val = this.$el.val();

    if (this.options.editor) {
      val = this.codeMirrorView.getContent();
    }

    return (val === '') ? null : val;
  },

  _toggleDisableState: function () {
    if (this.options.disabled) {
      this.$el.attr('readonly', '');
      this.$el.attr('placeholder', '');
    } else {
      this.$el.removeAttr('readonly');
      this._togglePlaceholder();
    }

    this.$el.toggleClass('is-disabled', !!this.options.disabled);
  },

  _initViews: function () {
    this._destroyEditor();

    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      hints: hints,
      mode: 'text/mustache',
      autocompleteChars: 2,
      autocompleteTriggers: ['{{'],
      autocompletePrefix: '{{',
      autocompleteSuffix: '}}',
      placeholder: this.options.placeholder,
      tip: ''
    });

    var $codeMirrorEl = $(this.codeMirrorView.render().el);
    this.$el.replaceWith($codeMirrorEl);
    this.setElement($codeMirrorEl);
    this.$el.addClass('CodeMirror-formInput');
  },

  _hasEditor: function () {
    return this.options.editor && !!this.codeMirrorView;
  },

  _destroyEditor: function () {
    if (this._hasEditor()) {
      this.codeMirrorView.remove();
    }
  },

  remove: function () {
    this._destroyEditor();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
