var $ = require('jquery');
var _ = require('underscore');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');

var ESCAPE_KEY_CODE = 27;

var simulateEscapeKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = ESCAPE_KEY_CODE;
  $(document).trigger(e);
};

describe('components/context-menu/context-menu-view', function () {
  var view, collection, triggerElement, button;

  var createViewFn = function () {
    collection = new CustomListCollection([
      {
        label: 'Label 1',
        val: 'value-1'
      }, {
        label: 'Label 2',
        val: 'value-2'
      }
    ]);

    triggerElement = $('<div id="something"></div>');
    button = $('<button class="js-toggle-menu"></button>');
    triggerElement.append(button);

    $('body').append(triggerElement);

    var view = new ContextMenuView({
      collection: collection,
      triggerElementID: triggerElement[0].id,
      position: {
        x: 300,
        y: 400
      },
      offset: {
        x: 100,
        y: 200
      }
    });

    triggerElement.on('click', function (ev) {
      view.toggle();
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
    view.render();
  });

  afterEach(function () {
    var el = triggerElement.get(0);
    var parent = el.parentNode;
    parent && parent.removeChild(el);
    triggerElement.remove();
    view.clean();
  });

  it('should render properly', function () {
    expect(_.size(view._subviews)).toBe(2);
  });

  it('should render a list with the given items', function () {
    expect(view.$el.find('button[title="Label 1"]')).toBeDefined();
    expect(view.$el.find('button[title="Label 2"]')).toBeDefined();
  });

  it('should be toggled when clicking on the triggerElement', function () {
    expect(view.$el.css('display')).toEqual('none');

    triggerElement.click();
    expect(view.$el.css('display')).toEqual('block');

    triggerElement.click();
    expect(view.$el.css('display')).toEqual('none');
  });

  it('should be toggled when clicking on an element inside of the triggerElement', function () {
    expect(view.$el.css('display')).toEqual('none');

    button.click();
    expect(view.$el.css('display')).toEqual('block');

    button.click();
    expect(view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on the overlay', function () {
    triggerElement.click();

    expect(view.$el.css('display')).toEqual('block');

    $('.CDB-Box-modalOverlay').trigger('click');

    spyOn(view, 'hide').and.callThrough();

    expect(view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when hitting ESCAPE', function () {
    triggerElement.click();

    expect(view.$el.css('display')).toEqual('block');

    simulateEscapeKeyPress();

    expect(view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on one of the items', function () {
    triggerElement.click();

    expect(view.$el.css('display')).toEqual('block');
    expect(collection.at(0).get('selected')).toBe(false);
    expect(collection.at(1).get('selected')).toBe(false);

    view.$el.find('button[title="Label 1"]').click();
    expect(collection.at(0).get('selected')).toBe(true);
    expect(collection.at(1).get('selected')).toBe(false);

    expect(view.$el.css('display')).toEqual('none');
  });

  it('should not try to hide the context menu when clicking somewhere else', function () {
    spyOn(view, 'hide');

    $('.CDB-Box-modalOverlay').trigger('click');
    expect(view.hide).not.toHaveBeenCalled();

    view.show();

    $('.CDB-Box-modalOverlay').trigger('click');
    expect(view.hide).toHaveBeenCalled();
  });

  it('should not try to hide the context menu when ESC key is pressed', function () {
    spyOn(view, 'hide').and.callThrough();

    simulateEscapeKeyPress();
    expect(view.hide).not.toHaveBeenCalled();

    view.show();

    simulateEscapeKeyPress();
    expect(view.hide).toHaveBeenCalled();
  });

  describe('.clean', function () {
    beforeEach(function () {
      view.show();
    });

    it('should unbind ESC key', function () {
      spyOn(view, 'hide');

      simulateEscapeKeyPress();

      expect(view.hide).toHaveBeenCalled();
      view.hide.calls.reset();

      view.clean();

      simulateEscapeKeyPress();

      expect(view.hide).not.toHaveBeenCalled();
    });
  });
});
