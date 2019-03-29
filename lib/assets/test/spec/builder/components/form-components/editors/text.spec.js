var _ = require('underscore');
var Backbone = require('backbone');

describe('components/form-components/editors/text', function () {
  var createViewFn = function (options) {
    var defaultOptions = {
      schema: {}
    };

    var view = new Backbone.Form.editors.Text(_.extend(defaultOptions, options));
    view.render();

    return view;
  };

  it('should render properly', function () {
    var view = createViewFn();
    expect(view.$el.attr('type')).toBe('text');

    view.remove();
  });

  it('should be possible to create another text type', function () {
    var view = createViewFn({
      schema: {
        editorAttrs: {
          type: 'email'
        }
      }
    });
    expect(view.$el.attr('type')).toBe('email');

    view.remove();
  });

  it('should return the value', function () {
    var view = createViewFn({
      value: 'Hello',
      schema: {}
    });

    expect(view.options.value).toBe('Hello');
    view.render();
    expect(view.getValue()).toBe('Hello');

    view.remove();
  });

  describe('change value', function () {
    beforeEach(function () {
      this.view = createViewFn();

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

  it('should render custom placeholder if provided', function () {
    var view = createViewFn({
      placeholder: 'wadus'
    });

    expect(view.$el.prop('placeholder')).toContain('wadus');

    view.remove();
  });

  it('should be disabled if provided', function () {
    var view = createViewFn({
      disabled: true
    });

    expect(view.$el.prop('readonly')).toBe(true);
    expect(view.$el.hasClass('is-disabled')).toBe(true);

    view.remove();
  });

  it('should destroy custom list, and tooltip when element is removed', function () {
    var view = createViewFn();
    spyOn(view, '_removeTooltip');

    view.remove();

    expect(view._removeTooltip).toHaveBeenCalled();
  });

  describe('with help', function () {
    var view;

    beforeEach(function () {
      view = createViewFn({
        editorAttrs: {
          help: 'help'
        }
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view._help).toEqual('help');
        expect(view._helpTooltip).toBeDefined();
      });
    });

    describe('._removeTooltip', function () {
      it('should destroy tooltip', function () {
        spyOn(view._helpTooltip, 'clean');

        view._removeTooltip();

        expect(view._helpTooltip.clean).toHaveBeenCalled();
      });
    });
  });

  it('should not have leaks', function () {
    var view = createViewFn();
    expect(view).toHaveNoLeaks();
  });
});
