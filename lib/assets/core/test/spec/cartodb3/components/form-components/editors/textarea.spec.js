var _ = require('underscore');
var Backbone = require('backbone');

describe('components/form-components/editors/textarea', function () {
  var createViewFn = function (options) {
    var model = new Backbone.Model({
      street_address_column: ''
    });

    var defaultOptions = {
      schema: {},
      model: model,
      key: 'street_address_column'
    };

    var view = new Backbone.Form.editors.TextArea(_.extend(defaultOptions, options));
    view.render();
    return view;
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  it('set key variable', function () {
    var view = this.createView();
    expect(view.key).toBe('street_address_column');
    view.remove();
  });

  it('should render properly', function () {
    var view = this.createView();
    expect(view.$el.prop('tagName').toLowerCase()).toBe('textarea');
    view.remove();
  });

  it('should return the value', function () {
    var model = new Backbone.Model({
      street_address_column: 'Hello'
    });

    var view = this.createView({
      model: model
    });

    expect(view.getValue()).toBe('Hello');
    view.remove();
  });

  describe('change value', function () {
    beforeEach(function () {
      this.view = this.createView();

      this.onChanged = jasmine.createSpy('onChanged');
      this.view.bind('change', this.onChanged);
    });

    describe('when input changes', function () {
      beforeEach(function () {
        this.view.$el
          .val(6)
          .trigger('keyup');
      });

      it('should trigger change', function () {
        expect(this.onChanged).toHaveBeenCalled();
      });

      it('should update input', function () {
        expect(this.view.$el.val()).toBe('6');
      });
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
