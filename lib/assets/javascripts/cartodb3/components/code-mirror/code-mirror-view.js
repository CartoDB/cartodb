var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CodeMirror = require('codemirror');
var template = require('./code-mirror.tpl');
var bulletTemplate = require('./code-mirror-bullet.tpl');
var errorTemplate = require('./code-mirror-error.tpl');
require('./mode/sql')(CodeMirror);
require('./cartocss.code-mirror')(CodeMirror);
require('./scroll.code-mirror')(CodeMirror);
require('./show-hint.code-mirror')(CodeMirror);
require('./hint/custom-list-hint')(CodeMirror);
require('./searchcursor.code-mirror')(CodeMirror);

var ESCAPE_KEY_CODE = 27;
var RETURN_KEY_CODE = 13;

var NOHINT = [ESCAPE_KEY_CODE, RETURN_KEY_CODE];

module.exports = CoreView.extend({
  className: 'Editor-content',

  initialize: function (opts) {
    if (!opts) throw new Error('options for codemirror are required.');
    if (!opts.model) throw new Error('Model for codemirror is required.');
    if (opts.model.get('content') === undefined) throw new Error('Content property for codemirror is required.');
    if (!opts.tip) throw new Error('tip message is required');

    this._mode = opts.mode || 'cartocss';
    this._hints = opts.hints;
    this._errorTemplate = opts.errorTemplate || errorTemplate;
    this._tip = opts.tip;
    this._lineWithErrors = [];
    this._onInputRead = _.bind(this._onKeyUpEditor, this);
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
    this._showErrors();
    return this;
  },

  _initViews: function () {
    var isReadOnly = this.model.get('readonly');
    var self = this;
    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: true,
      theme: 'material',
      mode: this._mode,
      scrollbarStyle: 'simple',
      lineWrapping: true,
      readOnly: isReadOnly,
      extraKeys: {
        'Ctrl-S': this.triggerApplyEvent.bind(this),
        'Cmd-S': this.triggerApplyEvent.bind(this),
        'Ctrl-Space': function (cm) {
          self._showAutocomplete(cm);
        }
      }
    });

    if (this._hints) {
      this.editor.on('keyup', this._onInputRead);
    }

    this._toggleReadOnly();

    setTimeout(function () {
      this.editor.refresh();
    }.bind(this), 0);
  },

  updateHints: function (hints) {
    this._hints = hints;
  },

  _onKeyUpEditor: function (cm, event) {
    var code = event.keyCode;
    var hints = this._hints;

    if (NOHINT.indexOf(code) === -1) {
      var self = this;

      if (this._autocompleteTimeout) clearTimeout(this._autocompleteTimeout);

      this._autocompleteTimeout = setTimeout(function () {
        var cur = cm.getCursor();
        var str = cm.getTokenAt(cur).string;
        str = str.toLowerCase();

        if (str.length > 2) {
          var list = _.filter(hints, function (listItem) {
            // every list can be an array of strings or an array of objects {text, type}
            var hit = _.isObject(listItem) ? listItem.text : listItem;
            hit = hit.toLowerCase();
            return hit.indexOf(str) !== -1;
          });

          if (!cm.state.completionActive && str.length > 2 && list.length > 0) {
            self._showAutocomplete(cm);
          }
        }
      }, 150);
    }
  },

  _showAutocomplete: function (cm) {
    CodeMirror.showHint(cm, CodeMirror.hint['custom-list'], {
      completeSingle: false,
      list: this._hints
    });
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
    var cursor = this.editor.getSearchCursor(query, null, true);
    cursor.find();
    return cursor.pos;
  },

  markReadOnly: function (from, to) {
    var options = {readOnly: true, inclusiveLeft: true};
    this.editor.markText(from, to, options);

    for (var i = from.line; i <= to.line; i++) {
      this.editor.addLineClass(i, 'background', 'CodeMirror-readonlyLine');
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

    if (errors && errors.length > 0) {
      _.each(errors, function (err) {
        this._renderError(err);
        this._renderBullet(err);
      }, this);
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

  clean: function () {
    this.destroyEditor();
    CoreView.prototype.clean.apply(this);
  }
});
