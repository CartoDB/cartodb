var cdb = require('cartodb.js');
var _ = require('underscore');
var CodeMirror = require('codemirror');
var template = require('./code-mirror.tpl');
var bulletTemplate = require('./code-mirror-bullet.tpl');
var errorTemplate = require('./code-mirror-error.tpl');
require('./cartocss.code-mirror')(CodeMirror);
require('./scroll.code-mirror')(CodeMirror);

module.exports = cdb.core.View.extend({
  className: 'Editor-content',

  initialize: function (opts) {
    if (!opts.model) throw new Error('Model for codemirror is required.');
    if (!opts.model.get('content')) throw new Error('Content property for codemirror is required.');

    this._lineWithErrors = [];
  },

  render: function () {
    this.$el.html(
      template({
        content: this.model.get('content')
      })
    );

    this._initViews();
    this._bindEvents();
    return this;
  },

  _initViews: function () {
    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: true,
      theme: 'material',
      mode: 'cartocss',
      scrollbarStyle: 'simple',
      extraKeys: {
        'Ctrl-S': this.triggerApplyEvent.bind(this),
        'Cmd-S': this.triggerApplyEvent.bind(this)
      }
    });

    setTimeout(function () {
      this.editor.refresh();
    }.bind(this), 0);
  },

  _bindEvents: function () {
    var self = this;
    this.editor.on('change', function (editor, changed) {
      self.model.set('content', self.getContent(), { silent: true });
    });

    this.model.bind('change:content', function () {
      this.setContent(this.model.get('content'));
    }, this);

    this.model.bind('change:errors', function () {
      this._showErrors();
    }, this);

    this.model.bind('undo redo', function () {
      this.setContent(this.model.get('content'));
    }, this);
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

  _getConsole: function () {
    return this.$('.js-console');
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
    var $line = this._getCode().children().eq(+line - 1);
    $line.append(bulletTemplate);
    $line.find('.CodeMirror-linenumber').addClass('has-error');
    this._lineWithErrors.push($line);
  },

  _renderError: function (error) {
    this._getConsole().append(errorTemplate(error));
  },

  _renderNoError: function () {
    this._getConsole().html(_t('components.codemirror.no-errors'));
  },

  clean: function () {
    this.destroyEditor();
    cdb.core.View.prototype.clean.apply(this);
  }
});
