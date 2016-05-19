var $ = require('jquery');
var CustomListCollection = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-collection');
var ContextMenuView = require('../../../../../javascripts/cartodb3/components/context-menu/context-menu-view');

describe('components/context-menu/context-menu-view', function () {
  beforeEach(function () {
    this.collection = new CustomListCollection([
      {
        label: 'Label 1',
        val: 'value-1'
      }, {
        label: 'Label 2',
        val: 'value-2'
      }
    ]);

    this.triggerElement = $('<div></div>');
    this.button = $('<button class="js-show-menu"></button>');
    this.triggerElement.append(this.button);
    $('body').append(this.triggerElement);

    this.view = new ContextMenuView({
      collection: this.collection,
      triggerElement: this.triggerElement[0]
    });

    this.view.render();
    $('body').append(this.view.el);

    this.view.$el.appendTo(document.body);
  });

  afterEach(function () {
    this.triggerElement.remove();
    this.view.clean();
  });

  it('should render a list with the given items', function () {
    expect(this.view.$el.find('button[title="Label 1"]')).toBeDefined();
    expect(this.view.$el.find('button[title="Label 2"]')).toBeDefined();
  });

  it('should be toggled when clicking on the triggerElement', function () {
    expect(this.view.$el.css('display')).toEqual('none');

    this.triggerElement.click();

    expect(this.view.$el.css('display')).toEqual('block');

    this.triggerElement.click();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be toggled when clicking on an element inside of the triggerElement', function () {
    expect(this.view.$el.css('display')).toEqual('none');

    this.button.click();

    expect(this.view.$el.css('display')).toEqual('block');

    this.button.click();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on the docuemnt', function () {
    this.triggerElement.click();

    expect(this.view.$el.css('display')).toEqual('block');

    $('body').click();

    expect(this.view.$el.css('display')).toEqual('none');
  });

  it('should be hidden when clicking on one of the items', function () {
    this.triggerElement.click();

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
      triggerElement: this.triggerElement[0],
      offset: { top: '0px', right: '1px', bottom: '2px', left: '3px', wadus: 'wadus' }
    });

    this.view.render();

    expect(this.view.$el.css('top')).toEqual('0px');
    expect(this.view.$el.css('right')).toEqual('1px');
    expect(this.view.$el.css('bottom')).toEqual('2px');
    expect(this.view.$el.css('left')).toEqual('3px');
    expect(this.view.$el.css('wadus')).toBeUndefined();
  });
});
