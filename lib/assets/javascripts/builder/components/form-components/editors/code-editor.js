var $ = require('jquery');
var Backbone = require('backbone');
var FactoryHints = require('builder/editor/editor-hints/factory-hints');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');

Backbone.Form.editors.CodeEditor = Backbone.Form.editors.TextArea.extend({
  render: function () {
    this.setValue(this.value);

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

    this._toggleDisableState();

    return this;
  },

  getValue: function () {
    var val = this.$el.val();

    val = this.codeMirrorView.getContent();

    return (val === '') ? null : val;
  },

  _initViews: function () {
    this._destroyEditor();

    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      hints: hints,
      mode: 'text/mustache',
      autocompleteChars: 2,
      autocompletePrefix: '{{',
      autocompleteSuffix: '}}',
      placeholder: this.options.placeholder,
      tips: []
    });
    this.codeMirrorView.bind('codeChanged', function () {
      this.trigger('change', this.codeMirrorView.getContent());
    }, this);

    var $codeMirrorEl = $(this.codeMirrorView.render().el);
    this.$el.replaceWith($codeMirrorEl);
    this.setElement($codeMirrorEl);
    this.$el.addClass('CodeMirror-formInput');
    // The default el is replace it with another dom node
    // we should add tracking class manually again
    this._addTrackingClass();
  },

  _addTrackingClass: function () {
    if (this.options.trackingClass) {
      var trackClasses = this.options.trackingClass + ' track-' + this.options.key + this.options.editorType;
      this.$el.addClass(trackClasses);
    }
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
