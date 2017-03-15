var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/text');

describe('components/form-components/editors/text', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Text({
      schema: {}
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.attr('type')).toBe('text');
  });

  it('should return the value', function () {
    var view = new Backbone.Form.editors.Text({
      value: 'Hello',
      schema: {}
    });

    expect(view.options.value).toBe('Hello');
    view.render();
    expect(view.getValue()).toBe('Hello');
  });

  describe('change value', function () {
    beforeEach(function () {
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

      it('should increase the value when pressing the up key', function () {
        this.view.setValue(7);

        var e = $.Event('keydown');
        e.keyCode = e.which = 38;

        this.view.$el.trigger(e);
        this.view.$el.trigger(e);
        this.view.$el.trigger(e);

        expect(this.view.$el.val()).toBe('10');
      });

      it('should increase the value when pressing the up key and shift', function () {
        this.view.setValue(10);

        var e = $.Event('keydown');
        e.keyCode = e.which = 38;
        e.shiftKey = true;

        this.view.$el.trigger(e);
        this.view.$el.trigger(e);
        this.view.$el.trigger(e);

        expect(this.view.$el.val()).toBe('40');
      });

      it('should decrease the value when pressing the down key', function () {
        this.view.setValue(7);

        var e = $.Event('keydown');
        e.keyCode = e.which = 40;

        this.view.$el.trigger(e);
        this.view.$el.trigger(e);
        this.view.$el.trigger(e);

        expect(this.view.$el.val()).toBe('4');
      });

      it('should decrease the value when pressing the down key and shift', function () {
        this.view.setValue(70);

        var e = $.Event('keydown');
        e.keyCode = e.which = 40;
        e.shiftKey = true;

        this.view.$el.trigger(e);
        this.view.$el.trigger(e);
        this.view.$el.trigger(e);

        expect(this.view.$el.val()).toBe('40');
      });
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
