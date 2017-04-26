var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/text');

describe('components/form-components/editors/text', function () {
  var createViewFn = function (options) {
    var defaultOptions = {
      schema: {}
    };

    this.view = new Backbone.Form.editors.Text(_.extend(defaultOptions, options));
    this.view.render();
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  it('should render properly', function () {
    this.createView();

    expect(this.view.$el.attr('type')).toBe('text');
  });

  it('should return the value', function () {
    this.createView({
      value: 'Hello',
      schema: {}
    });

    expect(this.view.options.value).toBe('Hello');
    this.view.render();
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

  it('should render custom placeholder if provided', function () {
    this.createView({
      placeholder: 'wadus'
    });

    expect(this.view.$el.prop('placeholder')).toContain('wadus');
  });

  it('should be disabled if provided', function () {
    this.createView({
      disabled: true
    });

    expect(this.view.$el.prop('readonly')).toBe(true);
    expect(this.view.$el.hasClass('is-disabled')).toBe(true);
  });

  afterEach(function () {
    this.view.remove();
  });
});
