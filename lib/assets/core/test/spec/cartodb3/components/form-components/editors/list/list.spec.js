var Backbone = require('backbone');

describe('components/form-components/editors/list/list', function () {
  beforeEach(function () {
    this.validator = jasmine.createSpy('validator').and.returnValue({
      error: true,
      message: 'Foo'
    });

    this.view = new Backbone.Form.editors.List({
      trackingClass: 'Foo-trackingClass',
      value: ['wadus', 'foodie'],
      schema: {
        validators: [ this.validator ]
      }
    });

    spyOn(this.view, 'addItem').and.callThrough();

    this.view.render();
  });

  describe('render', function () {
    it('addItem', function () {
      var n = this.view.value.length;
      expect(this.view.addItem).toHaveBeenCalledTimes(n);
    });

    it('tracking class', function () {
      var n = this.view.value.length;
      expect(this.view.$('.Foo-trackingClass').length).toBe(n);
    });
  });

  describe('validation', function () {
    it('should happen on render', function () {
      var n = this.view.value.length;
      expect(this.view.errors.length).toBe(n);
    });

    describe('add item button', function () {
      it('without validation error', function () {
        this.validator.and.returnValue(null);
        this.view.validate();

        var button = this.view.$('[data-action="add"]');
        expect(button.hasClass('is-disabled')).toBe(false);
      });

      it('with validation error', function () {
        this.validator.and.returnValue({
          error: true,
          message: 'Important error'
        });

        this.view.validate();

        var n = this.view.value.length;
        var button = this.view.$('[data-action="add"]');

        expect(button.hasClass('is-disabled')).toBe(true);
        expect(this.view.errors.length).toBe(n);
      });

      it('error presenter', function () {
        this.validator.and.returnValue({
          error: true,
          message: 'Foo'
        });

        this.view.validate();
        var error = this.view._errorPresenter();
        expect(error).toBe('Foo');
      });
    });
  });
});
