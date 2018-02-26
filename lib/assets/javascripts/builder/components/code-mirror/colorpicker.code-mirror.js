var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var ColorPicker = require('builder/components/form-components/editors/fill/color-picker/color-picker.js');
var COLOR_KEYWORDS = require('builder/helpers/color-keywords');

/**
 *  Show color picker when user clicks over
 *  a color in the Codemirror editor.
 *
 *  new CodemirrorColorPicker({
 *    editor: codemirror-editor...
 *  })
 */

var REQUIRED_OPTS = [
  'editor'
];

var STYLE = _.template('1px solid  <%- color %>');
var COLORPICKER_HEIGHT = 220;

var stopPropagation = function (e) {
  e.stopPropagation();
};

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._updateColors = _.debounce(this._updateColors, 5).bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._editor = opts.editor;
    this._initBinds();
  },

  _initBinds: function () {
    var self = this;
    var destroyPicker = function () {
      this._destroyPicker();
    }.bind(this);

    this._enableUpdateBind();

    this._editor.on('mousedown', function (cm, ev) {
      _.delay(self._onClick.bind(self, cm, ev), 50);
    });

    this._editor.on('keydown', destroyPicker);
    this._editor.on('viewportChange', destroyPicker);
    this._editor.on('scroll', destroyPicker);

    var wrapper = this._editor.getWrapperElement();
    wrapper.addEventListener('click', stopPropagation);
  },

  _disableBinds: function () {
    var wrapper = this._editor.getWrapperElement();
    wrapper.removeEventListener('click', stopPropagation);
    this._editor.off(null, null, this);
  },

  _enableUpdateBind: function () {
    this._editor.on('update', this._updateColors);
  },

  _disableUpdateBind: function () {
    this._editor.off('update', this._updateColors);
  },

  _onClick: function (cm, ev) {
    var cursor = this._editor.getCursor(true);
    var token = this._editor.getTokenAt(cursor);

    if (token.type === 'color') {
      this._createPicker(ev, cursor, token);
    } else {
      this._destroyPicker();
    }
  },

  _updateColors: function (cm) {
    var wrapper = cm.getWrapperElement();
    _.each(wrapper.querySelectorAll('.cm-color'), function (node) {
      this._paintColor(node.textContent, node);
    }, this);
  },

  _replaceColor: function (color, target) {
    var cursor = this._editor.getCursor();
    var nameMatch = this._getMatch(cursor, 'name');
    var hexMatch = this._getMatch(cursor, 'hex');
    var match = nameMatch || hexMatch;
    var start;
    var end;

    if (match) {
      start = {
        line: cursor.line,
        ch: match.start
      };
      end = {
        line: cursor.line,
        ch: match.end
      };

      this._editor.replaceRange(color, start, end, 'paste');

      var wrapper = this._editor.getWrapperElement();
      _.each(wrapper.querySelectorAll('.cm-color'), function (node) {
        var nodeStyle = node.style;
        var nodeColor = node.innerText;
        if (!nodeStyle || !nodeStyle.borderBottom) {
          this._paintColor(nodeColor, node);
        }
      }, this);
    }
  },

  _paintColor: function (color, target) {
    target.style.borderBottom = STYLE({color: color});
  },

  _getMatch: function (cursor, type) {
    if (!type) return;
    var re;

    switch (type.toLowerCase()) {
      case 'name':
        re = new RegExp(COLOR_KEYWORDS.join('|'), 'g');
        break;
      case 'hsl':
        re = /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)/g;
        break;
      case 'rgb':
        re = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/;
        break;
      case 'hex':
        re = /#[a-fA-F0-9]{3,6}/g;
        break;
      default:
        console.log('Invalid color match selection');
        return;
    }

    var line = this._editor.getLine(cursor.line);
    var match = re.exec(line);

    while (match) {
      var val = match[0];
      var len = val.length;
      var start = match.index;
      var end = match.index + len;
      if (cursor.ch >= start && cursor.ch <= end) {
        match = null;
        return {
          start: start,
          end: end,
          string: val
        };
      }
      match = re.exec(line);
    }
  },

  _createPicker: function (ev, cursor, token) {
    var cursorCoords = this._editor.cursorCoords();
    this._destroyPicker();

    this._colorPicker = new ColorPicker({
      className: 'Editor-boxModal ColorPicker--cm Editor-boxModal--darked Editor-FormDialog CDB-Text',
      value: token.string,
      disableOpacity: true
    });
    this._colorPicker.$el.attr('data-colorpicker-cid', this.cid);
    this._colorPicker.bind('change', _.debounce(this._onColorPickerChange.bind(this, ev), 5), this);

    var top = cursorCoords.top + 20;
    var maxTop = $(window).outerHeight();

    if (top + COLORPICKER_HEIGHT > maxTop) {
      top = cursorCoords.top - COLORPICKER_HEIGHT - 20;
    }

    this._colorPicker.$el.css({
      left: cursorCoords.left,
      top: top
    });

    document.body.appendChild(this._colorPicker.render().el);
    document.addEventListener('click', this._onDocumentClick);
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);
    if ($el.closest('[data-colorpicker-cid="' + this.cid + '"]').length === 0) {
      this._destroyPicker();
    }
  },

  _onColorPickerChange: function (ev, values) {
    this._disableUpdateBind();
    this._replaceColor(values.hex, ev.target);
    this.trigger('codeSaved');
    this._enableUpdateBind();
  },

  _destroyPicker: function () {
    if (this._colorPicker) {
      this.removeView(this._colorPicker);
      this._colorPicker.clean();
      delete this._colorPicker;
    }

    document.removeEventListener('click', this._onDocumentClick);
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.call(this);
  }
});
