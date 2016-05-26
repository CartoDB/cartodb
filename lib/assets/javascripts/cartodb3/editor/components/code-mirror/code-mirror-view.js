var cdb = require('cartodb.js');
var template = require('./code-mirror.tpl');
var CodeMirror = require('codemirror');
require('./cartocss.code-mirror')(CodeMirror);

module.exports = cdb.core.View.extend({
  className: 'CodeMirror-wrapper',

  initialize: function (opts) {
    if (!opts.model) throw new Error('Model for codemirror is required.');
    if (!opts.model.get('content')) throw new Error('Content property for codemirror is required.');
  },

  render: function () {
    this.$el.html(
      template({
        content: this.model.get('content')
      })
    );

    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;
    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: true,
      styleActiveLine: true,
      matchBrackets: true,
      theme: 'material',
      mode: 'cartocss'
    });

    this.editor.on('change', function (editor, changed) {
      self.model.set('content', self.getContent(), { silent: true });
    });

    this.model.bind('change:content', function () {
      this.setContent(this.model.get('content'));
    }, this);

    this.model.bind('undo redo', function () {
      this.setContent(this.model.get('content'));
    }, this);

    setTimeout(function () {
      this.editor.refresh();
    }.bind(this), 0);
  },

  setContent: function (value) {
    this.editor.setValue(value);
  },

  getContent: function () {
    return this.editor.getValue();
  },

  destroyEditor: function () {
    this.editor.off('change');
    var el = this.editor.getWrapperElement();
    el.parentNode.removeChild(el);
  },

  clean: function () {
    this.destroyEditor();
    cdb.core.View.prototype.clean.apply(this);
  }
});
