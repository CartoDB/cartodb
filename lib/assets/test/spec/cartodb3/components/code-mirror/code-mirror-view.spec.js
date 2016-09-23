var $ = require('jquery');
var Backbone = require('backbone');
var CodeMirror = require('codemirror');
var CodeMirrorView = require('../../../../../javascripts/cartodb3/components/code-mirror/code-mirror-view');

var SPACE_KEYCODE = 32;

var Pos = CodeMirror.Pos;

// fakeCodeMirrorKey(this.editor, "U", {shiftKey: true, ctrlKey: true, altKey: true});
// fakeCodeMirrorKey(this.editor, 32, {ctrlKey: true});
function fakeCodeMirrorKey (cm, type, code, props) {
  if (typeof code === 'string') code = code.charCodeAt(0);
  var e = {type: type, keyCode: code, preventDefault: function () {}, stopPropagation: function () {}};
  if (props) for (var n in props) e[n] = props[n];
  if (type === 'keydown') {
    cm.triggerOnKeyDown(e);
  }
  if (type === 'keyup') {
    cm.triggerOnKeyUp(e);
  }
  if (type === 'keypress') {
    cm.triggerOnKeyPress(e);
  }
}

describe('components/code-mirror/code-mirror-view', function () {
  beforeEach(function () {
    jasmine.clock().install();
    this.codemirrorModel = new Backbone.Model({
      content: '',
      readonly: false
    });

    var sqlKeywords = 'alter and as asc between by count create delete desc distinct drop from group having in insert into is join like not on or order select set table union update values where limit';

    this.hints = sqlKeywords.split(' ').map(function (item) {
      return {
        text: item
      };
    });

    this.view = new CodeMirrorView({
      model: this.codemirrorModel,
      hints: this.hints,
      mode: 'text/x-pgsql',
      tip: _t('editor.data.code-mirror.tip')
    });

    spyOn(this.view, '_showAutocomplete');

    this.view.render();
    this.editor = this.view.editor;
    this.view.$el.appendTo($('body'));
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should show autocomplete', function () {
    this.editor.setValue('sel');
    fakeCodeMirrorKey(this.editor, 'keyup', 'e');
    this.editor.setCursor(Pos(0, 3));
    jasmine.clock().tick(200);
    expect(this.view._showAutocomplete).toHaveBeenCalled();
  });

  it('should show autocomplete on demand', function () {
    this.editor.setValue('');
    fakeCodeMirrorKey(this.editor, 'keydown', SPACE_KEYCODE, {ctrlKey: true});
    expect(this.view._showAutocomplete).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
