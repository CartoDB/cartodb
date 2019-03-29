var _ = require('underscore');
var Backbone = require('backbone');
var CodeMirror = require('codemirror');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');

var SPACE_KEYCODE = 32;

var Pos = CodeMirror.Pos;

// fakeCodeMirrorKey(this.view.editor, "U", {shiftKey: true, ctrlKey: true, altKey: true});
// fakeCodeMirrorKey(this.view.editor, 32, {ctrlKey: true});
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
  var createViewFn = function (options) {
    this.model = new Backbone.Model({
      content: 'Foo',
      readonly: false
    });

    var sqlKeywords = 'alter and as asc between by count create delete desc distinct drop from group having in insert into is join like not on or order select set table union update values where limit';

    this.hints = sqlKeywords.split(' ').map(function (item) {
      return {
        text: item
      };
    });

    var defaultOptions = {
      model: this.model,
      hints: this.hints,
      addons: ['color-picker'],
      mode: 'text/x-pgsql',
      tips: [
        _t('editor.data.code-mirror.tip')
      ],
      placeholder: 'placeholder'
    };

    this.view = new CodeMirrorView(_.extend(defaultOptions, options));
    spyOn(this.view, '_showAutocomplete');
    spyOn(this.view, '_toggleReadOnly').and.callThrough();

    this.view.render();

    document.body.appendChild(this.view.el);
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);

    jasmine.clock().install();
  });

  afterEach(function () {
    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    jasmine.clock().uninstall();
  });

  it('should render properly', function () {
    this.createView();

    expect(this.view.$('.CodeMirror-editor').length).toBe(1);
    expect(this.view.$('.CodeMirror-console').length).toBe(1);
    expect(this.view.$('.js-editor').html()).toContain('Foo');
    expect(this.view.$('.js-console').html()).toContain('editor.data.code-mirror.tip');
  });

  it('should bind change:content properly', function () {
    this.createView();
    spyOn(this.view, 'setContent').and.callThrough();

    this.model.set('content', 'Bar');

    expect(this.view.setContent).toHaveBeenCalledWith('Bar');
  });

  it('should bind change:readonly properly', function () {
    this.createView();

    this.model.set('readonly', true);

    expect(this.view._toggleReadOnly).toHaveBeenCalled();
    expect(this.view.$('.js-console').attr('style')).toContain('display: none');
    expect(this.view.editor.getOption('theme')).toBe('');
    expect(this.view.editor.getOption('readOnly')).toBe(true);
  });

  it('should show autocomplete', function () {
    this.createView();

    this.view.editor.setValue('se');
    fakeCodeMirrorKey(this.view.editor, 'keyup', 'l');
    this.view.editor.setCursor(Pos(0, 2));
    jasmine.clock().tick(200);

    expect(this.view._showAutocomplete).not.toHaveBeenCalled();

    this.view.editor.setValue('sel');
    fakeCodeMirrorKey(this.view.editor, 'keyup', 'e');
    this.view.editor.setCursor(Pos(0, 3));
    jasmine.clock().tick(200);

    expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, {});
  });

  it('should show autocomplete on demand', function () {
    this.createView();

    this.view.editor.setValue('');
    fakeCodeMirrorKey(this.view.editor, 'keydown', SPACE_KEYCODE, { ctrlKey: true });

    expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, {});
  });

  describe('autocompleteChars', function () {
    it('should show autocomplete', function () {
      this.createView({
        autocompleteChars: 2
      });

      this.view.editor.setValue('s');
      fakeCodeMirrorKey(this.view.editor, 'keyup', 'e');
      this.view.editor.setCursor(Pos(0, 1));
      jasmine.clock().tick(200);

      expect(this.view._showAutocomplete).not.toHaveBeenCalled();

      this.view.editor.setValue('se');
      fakeCodeMirrorKey(this.view.editor, 'keyup', 'l');
      this.view.editor.setCursor(Pos(0, 2));
      jasmine.clock().tick(200);

      expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, {});
    });
  });

  describe('autocompletePrefix', function () {
    beforeEach(function () {
      this.createView({
        autocompleteChars: 2,
        autocompletePrefix: '{{',
        mode: 'text/mustache'
      });
    });

    describe('._showAutocomplete', function () {
      it('should show autocomplete', function () {
        this.view.editor.setValue('{');
        fakeCodeMirrorKey(this.view.editor, 'keyup', '{');
        this.view.editor.setCursor(Pos(0, 1));
        jasmine.clock().tick(200);

        expect(this.view._showAutocomplete).not.toHaveBeenCalled();

        this.view.editor.setValue('{{');
        fakeCodeMirrorKey(this.view.editor, 'keyup', 'c');
        this.view.editor.setCursor(Pos(0, 2));
        jasmine.clock().tick(200);

        expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, {});
      });
    });

    describe('._completeIfAfterCtrlSpace', function () {
      it('should show autocomplete on demand', function () {
        this.view.editor.setValue('');
        this.view.editor.setCursor(Pos(0, 0));

        this.view._completeIfAfterCtrlSpace(this.view.editor);

        expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, { autocompletePrefix: '{{' });

        this.view.editor.setValue('{{');
        this.view.editor.setCursor(Pos(0, 2));

        this.view._completeIfAfterCtrlSpace(this.view.editor);

        expect(this.view._showAutocomplete).toHaveBeenCalledWith(this.view.editor, {});
      });
    });
  });

  it('should show placeholder', function () {
    this.createView();

    this.view.editor.setValue('');

    expect(this.view.$('.CodeMirror-placeholder').html()).toContain('placeholder');
  });

  it('should not have any leaks', function () {
    this.createView();

    expect(this.view).toHaveNoLeaks();
  });
});
