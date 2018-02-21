var _ = require('underscore');
var CarouselFormView = require('builder/components/carousel-form-view');
var CustomCarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');

describe('components/carousel-form-view', function () {
  beforeEach(function () {
    this.collection = new CustomCarouselCollection([
      { val: 'hello', selected: true },
      { val: 'howdy' },
      { val: 'hi' }
    ]);
    this.view = new CarouselFormView({
      collection: this.collection,
      template: _.template('<div class="js-highlight"><%- name %></div><div class="js-selector"></div>')
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.Carousel').length).toBe(1);
    });

    it('should allow to add a className', function () {
      var view = new CarouselFormView({
        collection: this.collection,
        template: _.template('<div class="js-highlight"><%- name %></div><div class="js-selector"></div>'),
        itemOptions: {
          className: 'MyFabolousClassName'
        }
      });

      view.render();
      expect(view.$('button').hasClass('MyFabolousClassName')).toBeTruthy();
      view.clean();
    });

    it('should require js-selector class', function () {
      this.view.template = _.template('<div></div>');
      expect(this.view.render).toThrow();
    });
  });

  it('should update selector when item is highlighted if element exists', function () {
    expect(this.view.$('.js-highlight').text()).toBe('hello');
    this.collection.at(2).set('highlighted', true);
    expect(this.view.$('.js-highlight').text()).toBe('hi');
  });
});
