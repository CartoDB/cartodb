var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/textarea');

describe('components/form-components/editors/textarea', function () {
  var createViewFn = function (options) {
    this.model = new Backbone.Model({
      street_address_column: ''
    });

    var defaultOptions = {
      schema: {},
      model: this.model,
      key: 'street_address_column'
    };

    this.view = new Backbone.Form.editors.TextArea(_.extend(defaultOptions, options));
    this.view.render();
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  it('set key variable', function () {
    this.createView();
    expect(this.view.key).toBe('street_address_column');
  });

  it('should render properly', function () {
    this.createView();
    expect(this.view.$el.prop('tagName').toLowerCase()).toBe('textarea');
  });

  it('should return the value', function () {
    var model = new Backbone.Model({
      street_address_column: 'Hello'
    });

    this.createView({
      model: model
    });

    expect(this.view.getValue()).toBe('Hello');
  });

  describe('change value', function () {
    beforeEach(function () {
      this.createView();

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
  });

  afterEach(function () {
    this.view.remove();
  });
});
