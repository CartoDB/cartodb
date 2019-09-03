var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CodeMirror = require('codemirror');
var ColorPicker = require('./colorpicker.code-mirror');
var template = require('./code-mirror.tpl');
var bulletTemplate = require('./code-mirror-bullet.tpl');
var errorTemplate = require('./code-mirror-error.tpl');
var warningTemplate = require('./code-mirror-warning.tpl');
var DATA_SERVICES = require('./data-services');

require('./mode/sql')(CodeMirror);
require('./mode/mustache')(CodeMirror);
require('./cartocss.code-mirror')(CodeMirror);
require('./scroll.code-mirror')(CodeMirror);
require('./show-hint.code-mirror')(CodeMirror);
require('./hint/custom-list-hint')(CodeMirror);
require('./searchcursor.code-mirror')(CodeMirror);
require('./placeholder.code-mirror')(CodeMirror);

var ESCAPE_KEY_CODE = 27;
var RETURN_KEY_CODE = 13;

var NOHINT = [ESCAPE_KEY_CODE, RETURN_KEY_CODE];

var ADDONS = {
  'color-picker': ColorPicker
};

module.exports = CoreView.extend({
  module: 'components:code-mirror:code-mirror-view',

  className: 'Editor-content',

  options: {
    readonly: false,
    lineNumbers: true,
    autocompleteChars: 3
  },

  initialize: function (opts) {
    if (!opts) throw new Error('options for codemirror are required.');
    if (!opts.model) throw new Error('Model for codemirror is required.');
    if (opts.model.get('content') === void 0 &&
        opts.placeholder === void 0) throw new Error('Content property or placeholder for codemirror is required.');
    if (!opts.tips) throw new Error('tip messages are required');

    this._autocompleteChars = opts.autocompleteChars || this.options.autocompleteChars;
    this._mode = opts.mode || 'cartocss';
    this._addons = opts.addons;
    this._hints = opts.hints;
    this._autocompletePrefix = opts.autocompletePrefix;
    this._autocompleteTriggers = opts.autocompleteTriggers;
    this._autocompleteSuffix = opts.autocompleteSuffix;
    this._errorTemplate = opts.errorTemplate || errorTemplate;
    this._warningTemplate = opts.warningTemplate || warningTemplate;
    this._warnings = null;
    this._tips = opts.tips;
    this._lineWithErrors = [];
    this._onInputRead = _.bind(this._onKeyUpEditor, this);
    this._placeholder = opts.placeholder;
  },

  render: function () {
    this.$el.html(
      template({
        content: this.model.get('content'),
        tips: this._tips.join(' '),
        warnings: this._warnings
      })
    );

    this._initViews();
    this._bindEvents();
    this._showErrors();
    return this;
  },

  _initViews: function () {
    var options = _.defaults(_.extend({}, this.model.toJSON()), this.options);

    var isReadOnly = options.readonly;
    var hasLineNumbers = options.lineNumbers;

    var extraKeys = {
      'Ctrl-S': this.triggerApplyEvent.bind(this),
      'Cmd-S': this.triggerApplyEvent.bind(this),
      'Ctrl-Space': this._completeIfAfterCtrlSpace.bind(this)
    };

    this.editor = CodeMirror.fromTextArea(this.$('.js-editor').get(0), {
      lineNumbers: hasLineNumbers,
      theme: 'material',
      mode: this._mode,
      scrollbarStyle: 'simple',
      lineWrapping: true,
      readOnly: isReadOnly,
      extraKeys: extraKeys,
      placeholder: this._placeholder
    });
    this.editor.on('change', _.debounce(this._onCodeMirrorChange.bind(this), 150), this);

    if (!_.isEmpty(this._addons)) {
      _.each(this._addons, function (addon) {
        var Class = ADDONS[addon];
        var addonView = new Class({
          editor: this.editor
        });
        addonView.bind('codeSaved', this.triggerApplyEvent, this);
        this.$el.append(addonView.el);
        this.addView(addonView);
      }, this);
    }

    if (this._hints) {
      this.editor.on('keyup', this._onInputRead);
    }

    this._toggleReadOnly();

    setTimeout(function () {
      this.editor && this.editor.refresh();
    }.bind(this), 0);
  },

  _completeIfAfterCtrlSpace: function (cm) {
    var autocompletePrefix = this._autocompletePrefix;
    var opts = {};
    var cur = cm.getCursor();

    if (autocompletePrefix &&
        cm.getRange(CodeMirror.Pos(cur.line, cur.ch - autocompletePrefix.length), cur) !== autocompletePrefix) {
      opts = { autocompletePrefix: autocompletePrefix };
    }

    return this._completeAfter(cm, opts);
  },

  updateHints: function (hints) {
    this._hints = hints;
  },

  _onKeyUpEditor: function (cm, event) {
    var code = event.keyCode;
    var hints = this._hints;
    var autocompleteChars = this._autocompleteChars - 1;
    var autocompletePrefix = this._autocompletePrefix;

    if (NOHINT.indexOf(code) === -1) {
      var self = this;

      if (this._autocompleteTimeout) clearTimeout(this._autocompleteTimeout);

      this._autocompleteTimeout = setTimeout(function () {
        var opts = {};
        var cur = cm.getCursor();
        var str = cm.getTokenAt(cur).string;
        str = str.toLowerCase();

        if (autocompletePrefix &&
            cm.getRange(CodeMirror.Pos(cur.line, cur.ch - autocompletePrefix.length), cur) !== autocompletePrefix) {
          opts = { autocompletePrefix: autocompletePrefix };
        }

        return self._completeAfter(cm, opts, function () {
          var autocompleteHandler = function (listItem) {
            // every list can be an array of strings or an array of objects {text, type}
            var hit = _.isObject(listItem) ? listItem.text : listItem;
            hit = hit.toLowerCase();
            return hit.indexOf(str) !== -1;
          };

          if (str.length > autocompleteChars) {
            var listHints = _.filter(hints, autocompleteHandler);

            return listHints.length > 0 || autocompletePrefix && autocompletePrefix === str;
          }
        });
      }, 150);
    }
  },

  _onCodeMirrorChange: function () {
    this.trigger('codeChanged');
  },

  _completeAfter: function (cm, opts, pred) {
    if (!pred || pred()) {
      if (!cm.state.completionActive) {
        this._showAutocomplete(cm, _.extend({}, opts));
      }
    }

    return CodeMirror.Pass;
  },

  _showAutocomplete: function (cm, opts) {
    var autocompletePrefix = opts && opts.autocompletePrefix;

    CodeMirror.showHint(cm, CodeMirror.hint['custom-list'], {
      completeSingle: false,
      list: this._hints,
      autocompletePrefix: autocompletePrefix,
      autocompleteSuffix: this._autocompleteSuffix
    });
  },

  _showWarning: function (warnings) {
    var $warning = this._getWarning();
    var hasNodes = $warning.children().length;

    if (warnings && !hasNodes) {
      $warning.append(this._warningTemplate(warnings));
    }
  },

  _hideWarning: function () {
    var $warning = this._getWarning();
    var hasNodes = $warning.children().length;

    if (hasNodes) {
      $warning.children()[0].remove();
    }
  },

  _bindEvents: function () {
    var self = this;
    this.editor.on('change', function (editor, changed) {
      var content = self.getContent();
      var dataService = self._containsDataService(content);

      if (dataService) {
        self._showWarning('Quota error ' + dataService);
      } else {
        self._hideWarning();
      }

      self.model.set('content', content, { silent: true });
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
    var parent = el.parentNode;
    parent && parent.removeChild(el);
    this.editor = null;
  },

  _getInfo: function () {
    return this.$('.js-console');
  },

  _getConsole: function () {
    return this.$('.js-console-error');
  },

  _getWarning: function () {
    return this.$('.js-warning');
  },

  _getCode: function () {
    return this.$('.CodeMirror-code');
  },

  _containsDataService: function (content) {
    return _.find(DATA_SERVICES, function (dataService) {
      return content.indexOf(dataService) !== -1;
    });
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
