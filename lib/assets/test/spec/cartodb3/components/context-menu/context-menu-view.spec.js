var $ = require('jquery');
var CustomListCollection = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-collection');
var ContextMenuView = require('../../../../../javascripts/cartodb3/components/context-menu/context-menu-view');

var simulateEscapeKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = $.ui.keyCode.ESCAPE;
  $(document).trigger(e);
};

describe('components/context-menu/context-menu-view', function () {
  beforeEach(function () {
    var self = this;

    this.collection = new CustomListCollection([
      {
        label: 'Label 1',
        val: 'value-1'
      }, {
        label: 'Label 2',
        val: 'value-2'
      }
    ]);

    this.$button = $('<button class="js-show-menu" id="something"></button>');

    $('body').append(this.$button);

    this.view = new ContextMenuView({
      collection: this.collection,
      triggerElementID: this.$button[0].id
    });

    this.$button.on('click', function () {
      self.view.toggle();
    });

    this.view.render();
    $('body').append(this.view.el);

    this.view.$el.appendTo(document.body);
  });

  afterEach(function () {
    this.$button.remove();
    this.view.clean();
  });

  it('should render a list with the given items', function () {
    expect(this.view.$el.find('button[title="Label 1"]')).toBeDefined();
    expect(this.view.$el.find('button[title="Label 2"]')).toBeDefined();
  });

  it('should be toggled when clicking on the button', function () {
    expect(this.view.$el.css('display')).toEqual('none');

    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('block');

    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be toggled when clicking on an element inside of the button', function () {
    expect(this.view.$el.css('display')).toEqual('none');

    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('block');

    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on the document', function () {
    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('block');

    $('body').click();
    spyOn(this.view, '_onDocumentElementClicked');

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when hitting ESCAPE', function () {
    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('block');

    simulateEscapeKeyPress();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on one of the items', function () {
    this.$button.click();

    expect(this.view.$el.css('display')).toEqual('block');
    expect(this.collection.at(0).get('selected')).toBe(false);
    expect(this.collection.at(1).get('selected')).toBe(false);

    this.view.$el.find('button[title="Label 1"]').click();
    expect(this.collection.at(0).get('selected')).toBe(true);
    expect(this.collection.at(1).get('selected')).toBe(false);

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should apply the given offset', function () {
    this.view = new ContextMenuView({
      collection: this.collection,
      triggerElementID: this.$button[0].id,
      offset: { top: '0px', right: '1px', bottom: '2px', left: '3px', wadus: 'wadus' }
    });

    this.view.render();

    expect(this.view.$el.css('top')).toEqual('0px');
    expect(this.view.$el.css('right')).toEqual('1px');
    expect(this.view.$el.css('bottom')).toEqual('2px');
    expect(this.view.$el.css('left')).toEqual('3px');
    expect(this.view.$el.css('wadus')).toBeUndefined();
  });

  describe('binds on unvisible', function () {
    beforeEach(function () {
      spyOn(this.view, 'hide');
    });

    it('should not bind outside click', function () {
      $('body').click();
      expect(this.view.hide).not.toHaveBeenCalled();
      this.$button.click();
      $('body').click();
      expect(this.view.hide).toHaveBeenCalled();
    });

    it('should not bind ESC keypress', function () {
      simulateEscapeKeyPress();
      expect(this.view.hide).not.toHaveBeenCalled();
      this.$button.click();
      simulateEscapeKeyPress();
      expect(this.view.hide).toHaveBeenCalled();
    });
  });

  describe('.clean', function () {
    beforeEach(function () {
      this.$button.click();
    });

    it('should unbind document clicks', function () {
      spyOn(this.view, 'hide');

      $('body').click();

      expect(this.view.hide).toHaveBeenCalled();
      this.view.hide.calls.reset();

      this.view.clean();

      $('body').click();

      expect(this.view.hide).not.toHaveBeenCalled();
    });

    it('should unbind ESC key', function () {
      spyOn(this.view, 'hide');

      simulateEscapeKeyPress();

      expect(this.view.hide).toHaveBeenCalled();
      this.view.hide.calls.reset();

      this.view.clean();

      simulateEscapeKeyPress();

      expect(this.view.hide).not.toHaveBeenCalled();
    });
  });
});
