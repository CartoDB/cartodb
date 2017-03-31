var $ = require('jquery');
var Backbone = require('backbone');
var FactoryHints = require('../../../editor/editor-hints/factory-hints');
var CodeMirrorView = require('../../code-mirror/code-mirror-view');

Backbone.Form.editors.TextArea = Backbone.Form.editors.TextArea.extend({
  className: 'CDB-Textarea',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts); // Options
    this.constructor.__super__.initialize.apply(this, arguments);

    this.value = this.model.get(this.options.keyAttr);
  },

  render: function () {
    this.setValue(this.value);

    if (this.options.editor) {
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

  _togglePlaceholder: function () {
    if (this.options.placeholder) {
      this.$el.attr('placeholder', this.options.placeholder);
    } else {
      var placeholder = (this.value === null) ? 'null' : '';
      this.$el.attr('placeholder', placeholder);
    }
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
    this._codemirrorModel = new Backbone.Model({
      content: this.value,
      readonly: false
    });

    FactoryHints.init({
      tokens: this.options.tokens,
      tableName: false,
      columnsName: false
    });

    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      hints: hints,
      mode: 'text/mustache',
      autocompleteChars: 2,
      autocompleteTriggers: ['{{'],
      autocompleteSuffix: '}}',
      placeholder: this.options.placeholder
    });

    var $codeMirrorEl = $(this.codeMirrorView.render().el);
    this.setElement($codeMirrorEl);
    this.$el.replaceWith($codeMirrorEl);
    this.$el.addClass('CodeMirror-formInput');
  }
});
