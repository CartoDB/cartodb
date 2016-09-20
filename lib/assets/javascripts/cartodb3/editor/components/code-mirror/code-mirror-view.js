var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CodeMirror = require('codemirror');
var template = require('./code-mirror.tpl');
var bulletTemplate = require('./code-mirror-bullet.tpl');
var errorTemplate = require('./code-mirror-error.tpl');
require('./cartocss.code-mirror')(CodeMirror);
require('./scroll.code-mirror')(CodeMirror);
require('./searchcursor.code-mirror')(CodeMirror);

module.exports = CoreView.extend({
  className: 'Editor-content',

  initialize: function (opts) {
    if (!opts.model) throw new Error('Model for codemirror is required.');
    if (opts.model.get('content') === undefined) throw new Error('Content property for codemirror is required.');
    if (!opts.tip) throw new Error('tip message is required');

    this._mode = opts.mode || 'cartocss';
    this._errorTemplate = opts.errorTemplate || errorTemplate;
    this._tip = opts.tip;
    this._lineWithErrors = [];
  },

  render: function () {
    this.$el.html(
      template({
        content: this.model.get('content'),
        tip: this._tip
      })
    );

    this._initViews();
    this._bindEvents();
    return this;
  },

  _initViews: function () {
    var isReadOnly = this.model.get('readonly');

    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: true,
      theme: 'material',
      mode: this._mode,
      scrollbarStyle: 'simple',
      lineWrapping: true,
      readOnly: isReadOnly,
      extraKeys: {
        'Ctrl-S': this.triggerApplyEvent.bind(this),
        'Cmd-S': this.triggerApplyEvent.bind(this)
      }
    });

    this._toggleReadOnly();

    setTimeout(function () {
      this.editor.refresh();
    }.bind(this), 0);
  },

  _bindEvents: function () {
    var self = this;
    this.editor.on('change', function (editor, changed) {
      self.model.set('content', self.getContent(), {silent: true});
    });

    this.model.on('change:content', function () {
      this.setContent(this.model.get('content'));
    }, this);

    this.model.on('change:readonly', this._toggleReadOnly, this);

    this.model.on('change:errors', function () {
      this._showErrors();
    }, this);

    this.model.on('undo redo', function () {
      this.setContent(this.model.get('content'));
    }, this);
  },

  _toggleReadOnly: function () {
    var isReadOnly = !!this.model.get('readonly');
    this.editor.setOption('readOnly', isReadOnly);
    if (isReadOnly) {
      this.editor.setOption('theme', '');
      this._getInfo().hide();
    } else {
      this.editor.setOption('theme', 'material');
      this._getInfo().show();
    }
  },

  search: function (query, caseInsensitive) {
    return this.editor.getSearchCursor(query, null, caseInsensitive || false);
  },

  markReadOnly: function (from, to) {
    var startLine = {line: from, ch: 0};
    var endLine = {line: to};
    var options = {readOnly: true, inclusiveLeft: true};
    this.editor.markText(startLine, endLine, options);

    for (var i = from; i < to - 1; i++) {
      this.editor.addLineClass(i, 'background', 'readonly');
    }
  },

  setContent: function (value) {
    this.editor.setValue(value);
  },

  getContent: function () {
    return this.editor.getValue();
  },

  triggerApplyEvent: function () {
    this.trigger('codeSaved', this.getContent(), this);
  },

  destroyEditor: function () {
    this.editor.off('change');
    var el = this.editor.getWrapperElement();
    el.parentNode.removeChild(el);
  },

  _getInfo: function () {
    return this.$('.js-console');
  },

  _getConsole: function () {
    return this.$('.js-console-error');
  },

  _getCode: function () {
    return this.$('.CodeMirror-code');
  },

  _removeErrors: function () {
    this._getConsole().empty();
    _.each(this._lineWithErrors, function ($line) {
      $line.find('.CodeMirror-bullet').remove();
      $line.find('.CodeMirror-linenumber').removeClass('has-error');
    });

    this._lineWithErrors = [];
  },

  _showErrors: function () {
    var errors = this.model.get('errors');
    this._removeErrors();

    if (errors.length > 0) {
      _.each(errors, function (err) {
        this._renderError(err);
        this._renderBullet(err);
      }, this);
    } else {
      this._renderNoError();
    }
  },

  _renderBullet: function (error) {
    var line = error.line;
    var $line;
    if (line) {
      $line = this._getCode().children().eq(+line - 1);
      $line.append(bulletTemplate);
      $line.find('.CodeMirror-linenumber').addClass('has-error');
      this._lineWithErrors.push($line);
    }
  },

  _renderError: function (error) {
    this._getConsole().append(this._errorTemplate(error));
  },

  _renderNoError: function () {
    this._getConsole().html(_t('components.codemirror.no-errors'));
  },

  clean: function () {
    this.destroyEditor();
    CoreView.prototype.clean.apply(this);
  }
});
