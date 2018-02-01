var $ = require('jquery');
var DropdownView = require('dashboard/components/dropdown/dropdown-base-view');

var ESCAPE_KEY_CODE = 27;

var simulateEscapeKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = ESCAPE_KEY_CODE;
  $(document).trigger(e);
};

var simulateClickPress = function () {
  var e = $.Event('click');
  $(document).trigger(e);
};

describe('dashboard/components/dropdown-view', function () {
  beforeEach(function () {
    this.node = $('<a></a>');
    this.view = new DropdownView({
      target: this.node
    });

    this.view.render();
    document.body.appendChild(this.view.el);
  });

  afterEach(function () {
    var el = this.view.el;
    var parent = el.parentNode;
    parent && parent.removeChild(el);
    this.view.remove();
  });

  it('should be closed initially', function () {
    expect(this.view.modelView.get('open')).toBe(false);
  });

  it('should open when target is clicked', function () {
    this.node.trigger('click');
    expect(this.view.modelView.get('open')).toBe(true);
  });

  it('should close on ESC key event', function () {
    spyOn(this.view, 'hide');

    this.view.modelView.set({open: true});
    simulateEscapeKeyPress();

    expect(this.view.hide).toHaveBeenCalled();
    expect(this.view.modelView.get('open')).toBe(false);
  });

  it('should close on document click event', function () {
    spyOn(this.view, 'hide');

    this.view.modelView.set({open: true});
    simulateClickPress();

    expect(this.view.hide).toHaveBeenCalled();
    expect(this.view.modelView.get('open')).toBe(false);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
