var _ = require('underscore');
var MosaicFormView = require('builder/components/mosaic-form-view');
var MosaicCollection = require('builder/components/mosaic/mosaic-collection');

describe('components/mosaic-form-view', function () {
  beforeEach(function () {
    this.collection = new MosaicCollection([
      { val: 'hello', selected: true },
      { val: 'howdy' },
      { val: 'hi' }
    ]);
    this.view = new MosaicFormView({
      collection: this.collection,
      template: _.template('<div class="js-highlight"><%- name %></div><div class="js-selector"></div>')
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.Mosaic').length).toBe(1);
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
