var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var Toggler = require('../../../../../javascripts/cartodb3/components/toggler/toggler-view.js');

describe('components/toggler/toggler', function () {
  beforeEach(function () {
    this.view = new Toggler({
      labelon: 'foo',
      labeloff: 'bar',
      checked: false
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input').prop('checked')).toBe(false);
    expect(this.view.$('label').length).toBe(2);
  });

  describe('change value', function () {
    beforeEach(function () {
      this.onChanged = jasmine.createSpy('onChanged');
      this.view.bind('change', this.onChanged);
    });

    describe('when input changes', function () {
      it('should trigger change', function () {
        this.view.$('.js-input').trigger('click');
        expect(this.onChanged).toHaveBeenCalled();
      });

      it('should update input', function () {
        this.view.$('.js-input').trigger('click');
        expect(this.view.$('.js-input').prop('checked')).toBe(true);
      });
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
