var $ = require('jquery');
var CodeMirror = require('codemirror');
require('../../../../../javascripts/cartodb3/components/code-mirror/cartocss.code-mirror')(CodeMirror);
var ColorpickerView = require('../../../../../javascripts/cartodb3/components/code-mirror/colorpicker.code-mirror');
var Pos = CodeMirror.Pos;

function fireMouseEvent (obj, evtName) {
  var event = document.createEvent('MouseEvents');
  event.initMouseEvent(evtName, true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  obj.dispatchEvent(event);
}

describe('components/code-mirror/colorpicker.code-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    this.editor = CodeMirror(document.body, {
      mode: 'cartocss',
      theme: 'material'
    });

    spyOn(ColorpickerView.prototype, '_updateColors').and.callThrough();
    spyOn(ColorpickerView.prototype, '_createPicker');
    spyOn(ColorpickerView.prototype, '_replaceColor').and.callThrough();

    this.view = new ColorpickerView({
      editor: this.editor
    });

    this.view.render();
    this.view.$el.appendTo($('body'));

    this.editor.setValue('#foo{marker-fill: #fbd;}');
  });

  afterEach(function () {
    jasmine.clock().uninstall();

    var el = this.editor.getWrapperElement();
    el.parentNode.removeChild(el);
    this.view.remove();
  });

  it('should update colors on init', function () {
    expect(ColorpickerView.prototype._updateColors).toHaveBeenCalled();
    expect($('.cm-color').length).toBe(1);
    expect($('.cm-color').css('border-bottom')).toBe('1px solid rgb(255, 187, 221)');
  });

  it('should show colorpicker on click', function () {
    fireMouseEvent(this.editor.display.scroller, 'mousedown');
    this.editor.setCursor(Pos(0, 21));
    jasmine.clock().tick(100);

    expect(ColorpickerView.prototype._createPicker).toHaveBeenCalled();
  });

  it('should update color', function () {
    this.editor.replaceRange('#fbdaaa', {line: 0, ch: 18}, {line: 0, ch: 22});
    jasmine.clock().tick(400);

    expect($('.cm-color').text()).toBe('#fbdaaa');
    expect($('.cm-color').css('border-bottom')).toBe('1px solid rgb(251, 218, 170)');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
