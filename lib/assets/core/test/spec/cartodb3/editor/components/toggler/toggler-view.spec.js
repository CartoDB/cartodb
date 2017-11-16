var Backbone = require('backbone');
var Toggler = require('../../../../../../javascripts/cartodb3/components/toggler/toggler-view.js');

describe('components/toggler/toggler', function () {
  beforeEach(function () {
    var togglerModel = new Backbone.Model({
      labels: ['foo', 'bar'],
      active: false,
      disabled: false,
      isDisableable: true,
      onChange: function () {}
    });

    this.view = new Toggler({
      model: togglerModel

    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$('.js-input').length).toBe(1);
      expect(this.view.$('.js-input').prop('checked')).toBe(false);
      expect(this.view.$('label').length).toBe(2);
    });

    it('should be active toggleModel.active is true', function () {
      this.view.model.set('active', true, { silent: true });
      this.view.render();

      expect(this.view.$('.js-input').prop('checked')).toBe(true);
    });

    it('should be disabled if is disableable', function () {
      this.view.model.set('disabled', true, { silent: true });
      this.view.render();

      expect(this.view.$('.js-input').prop('disabled')).toBe(true);
    });

    it('should not be disabled if is not disableable', function () {
      this.view.model.set({
        disabled: true,
        isDisableable: false
      }, { silent: true });
      this.view.render();

      expect(this.view.$('.js-input').prop('disabled')).toBe(false);
    });
  });

  describe('._initBinds', function () {
    beforeEach(function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
    });

    it('should re render on change:active', function () {
      this.view.model.trigger('change:active');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should re render on change:disabled', function () {
      this.view.model.trigger('change:disabled');
      expect(this.view.render).toHaveBeenCalled();
    });
  });

  describe('._onClick', function () {
    it('should toggle the property active in the model', function () {
      expect(this.view.model.get('active')).toBe(false);

      this.view._onClick();
      expect(this.view.model.get('active')).toBe(true);

      this.view._onClick();
      expect(this.view.model.get('active')).toBe(false);
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
