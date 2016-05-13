var cdb = require('cartodb.js');
var template = require('./code-mirror.tpl');
var CodeMirror = require('codemirror');

module.exports = cdb.core.View.extend({
  className: 'CodeMirror-wrapper',
  events: {
    'keyup .CodeMirror': 'getContent'
  },
  initialize: function (opts) {
    if (!opts.model) {
      throw new Error('Model for codemirror is required.');
    }
    if (!opts.model.get('content')) {
      throw new Error('Content property for codemirror is required.');
    }
  },
  render: function () {
    this.$el.html(template(this.model.attributes));
    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: true,
      theme: 'material'
    });

    setTimeout(function () {
      this.editor.refresh();
    }.bind(this), 0);

    return this;
  },

  getContent: function () {
    console.log(this.editor.getValue());
  }
});
