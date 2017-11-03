var Backbone = require('backbone');
var InputColorCategoriesList = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-categories/input-color-categories-list-view');

describe('components/form-components/editors/fill/input-color/input-categories/input-color-categories-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      domain: ['foo', 'bar', 'baz'],
      images: ['', '', ''],
      range: ['#5F4690', '#1D6996', '#38a6a5']
    });

    this.view = new InputColorCategoriesList({
      model: this.model
    });

    this.view.render();
    document.body.appendChild(this.view.el);
  });

  afterEach(function () {
    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    this.view.remove();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render properly', function () {
    this.view.render();
    expect(this.view.$el.find('.js-color').length).toBe(3);
    expect(this.view.$el.find('.js-listItem').length).toBe(3);
  });

  it('should allow click on colors if color is valid', function () {
    spyOn(this.view, 'trigger');

    this.view.$('.js-color').eq(1).trigger('click');
    expect(this.view.trigger).toHaveBeenCalledWith('selectItem', {
      index: 1,
      target: 'color'
    }, this.view);
  });

  it('should not allow click on colors if there is no colors', function () {
    spyOn(this.view, 'trigger');

    this.view._collection.reset([]); // No categories, reseted
    this.view.$('.js-color').eq(1).trigger('click');
    expect(this.view.trigger).not.toHaveBeenCalled();
  });
});
