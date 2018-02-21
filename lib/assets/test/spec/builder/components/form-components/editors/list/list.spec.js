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

  afterEach(function () {
    this.view.remove();
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

  describe('maxItems', function () {
    var view;

    beforeEach(function () {
      spyOn(Backbone.Form.editors.List.prototype, '_setAddButtonState').and.callThrough();
      view = new Backbone.Form.editors.List({
        trackingClass: 'Foo-trackingClass',
        value: ['wadus', 'foodie'],
        schema: {
          maxItems: 4,
          validators: ['required']
        }
      });

      view.render();
    });

    it('should check if add-button has to be visible or not', function () {
      expect(Backbone.Form.editors.List.prototype._setAddButtonState).toHaveBeenCalled();
    });

    it('should hide add-button when maxItems is reached', function () {
      Backbone.Form.editors.List.prototype._setAddButtonState.calls.reset();
      view._getAddButtonElement().click();
      expect(Backbone.Form.editors.List.prototype._setAddButtonState).toHaveBeenCalled();
      expect(view._getAddButtonElement().css('display')).not.toBe('none'); // 3 items, you can add a new one
      view._getAddButtonElement().click();
      expect(view._getAddButtonElement().css('display')).toBe('none');
    });

    it('should show add-button when maxItems is not reached', function () {
      Backbone.Form.editors.List.prototype._setAddButtonState.calls.reset();
      view.removeItem(view.items[0]);
      expect(Backbone.Form.editors.List.prototype._setAddButtonState).toHaveBeenCalled();
      expect(view._getAddButtonElement().css('display')).not.toBe('none');
    });

    it('should provide a custom error when maxItems is reached after validating it', function () {
      view.options.maxItems = 1;
      view.validate();
      expect(view.errors.length > 0).toBeTruthy();
      expect(view.errors[0]).toBe('form-components.editors.list.max-items');
    });
  });

  describe('_canAddNewItems', function () {
    it('should be falsy if there is any validation error', function () {
      this.view.errors = ['error'];
      expect(this.view._canAddNewItems()).toBeFalsy();
    });

    it('should be truthy if maxItems is not defined and no errors', function () {
      this.view.errors = [];
      delete this.view.options.maxItems; // JUst in case
      expect(this.view._canAddNewItems()).toBeTruthy();
    });

    it('should be truthy if maxItems has not been reached and no errors', function () {
      this.view.errors = [];
      this.view.options.maxItems = 3;
      expect(this.view._canAddNewItems()).toBeTruthy();
    });

    it('should be falsy if maxItems is defined and limit is reached', function () {
      this.view.errors = [];
      this.view.options.maxItems = 2;
      expect(this.view._canAddNewItems()).toBeFalsy();
    });
  });
});
