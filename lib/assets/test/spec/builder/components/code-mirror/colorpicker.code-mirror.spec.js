var _ = require('underscore');
var CodeMirror = require('codemirror');
require('builder/components/code-mirror/cartocss.code-mirror')(CodeMirror);
var ColorpickerView = require('builder/components/code-mirror/colorpicker.code-mirror');
var Pos = CodeMirror.Pos;

function fireMouseEvent (obj, evtName) {
  var event = document.createEvent('MouseEvents');
  event.initMouseEvent(evtName, true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  obj.dispatchEvent(event);
}

describe('components/code-mirror/colorpicker.code-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    jasmine.clock().install();

    this.editor = CodeMirror(document.body, {
      mode: 'cartocss',
      theme: 'material'
    });

    this.view = new ColorpickerView({
      editor: this.editor
    });

    spyOn(this.view, '_createPicker');

    this.view.render();
    document.body.appendChild(this.view.el);
  });

  afterEach(function () {
    jasmine.clock().uninstall();

    var el = this.editor.getWrapperElement();
    el.parentNode.removeChild(el);

    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    this.view.clean();
  });

  it('should update colors on editor update', function () {
    this.editor.setValue('#foo{marker-fill: #fabada;}');

    expect(document.querySelector('.cm-color')).toBeTruthy();
    expect(document.querySelector('.cm-color').style.borderBottom).toBe('1px solid rgb(250, 186, 218)');
  });

  it('should show colorpicker on click', function () {
    this.editor.setValue('#foo{marker-fill: #fabada;}');
    fireMouseEvent(this.editor.display.scroller, 'mousedown');
    // The cursor is put on top of the color artificially
    this.editor.setCursor(Pos(0, 21));
    jasmine.clock().tick(60);

    expect(this.view._createPicker).toHaveBeenCalled();
  });

  it('should update color', function () {
    this.editor.replaceRange('#fbdaaa', {line: 0, ch: 18}, {line: 0, ch: 22});
    jasmine.clock().tick(400);

    expect(document.querySelector('.cm-color').textContent).toBe('#fbdaaa');
    expect(document.querySelector('.cm-color').style.borderBottom).toBe('1px solid rgb(251, 218, 170)');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
