var Backbone = require('backbone');
var _ = require('underscore');
// Required for affected specs, because we use backbone-forms through a global namespace
require('builder/components/form-components/editors/list/list-item');

describe('components/form-components/editors/list/list-item', function () {
  var view;
  var createViewFn = function (options) {
    var defaultOptions = {
      schema: {},
      list: {}
    };

    return new Backbone.Form.editors.List.Item(_.extend(defaultOptions, options));
  };

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should render properly', function () {
      spyOn(view, '_removeTooltip');
      spyOn(view, 'setElement').and.callThrough();
      view.render();

      expect(view.$('[data-editor]').length).toBe(1);
      expect(view.setElement).toHaveBeenCalled();
    });

    it('should render a custom template', function () {
      var customTemplate = '<div>My custom Template</div>';
      view = createViewFn({
        template: _.template(customTemplate)
      });
      view.render();

      expect(view.el.outerHTML).toContain(customTemplate);
    });
  });

  describe('legend-list-item template', function () {
    beforeEach(function () {
      view = createViewFn({
        template: _.template('<div><div data-editor></div><button class="js-remove-help" type="button" data-action="remove">Remove</button></div>')
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        spyOn(view, '_removeTooltip');
        spyOn(view, 'setElement').and.callThrough();
        view.render();

        expect(view._removeTooltip).toHaveBeenCalled();
        expect(view._tooltip).toBeDefined();
      });
    });

    describe('._removeTooltip', function () {
      it('should destroy tooltip', function () {
        view.render();
        spyOn(view._tooltip, 'clean');

        view._removeTooltip();

        expect(view._tooltip.clean).toHaveBeenCalled();
      });
    });
  });

  describe('.getValue', function () {
    it('should call editor.getValue', function () {
      view.render();
      spyOn(view.editor, 'getValue');
      view.getValue();

      expect(view.editor.getValue).toHaveBeenCalled();
    });
  });

  describe('.setValue', function () {
    it('should call editor.setValue', function () {
      view = createViewFn();
      view.render();
      spyOn(view.editor, 'setValue');
      view.setValue('test');

      expect(view.editor.setValue).toHaveBeenCalledWith('test');
    });
  });

  describe('.focus', function () {
    it('should call editor.focus', function () {
      view = createViewFn();
      view.render();
      spyOn(view.editor, 'focus');
      view.focus();

      expect(view.editor.focus).toHaveBeenCalled();
    });
  });

  describe('.blur', function () {
    it('should call editor.blur', function () {
      view = createViewFn();
      view.render();
      spyOn(view.editor, 'blur');
      view.blur();

      expect(view.editor.blur).toHaveBeenCalled();
    });
  });

  describe('.validate', function () {
    it('should return null', function () {
      view = createViewFn();
      view.render();
      expect(view.validate()).toBeNull();
    });

    describe('with validators', function () {
      beforeEach(function () {
        view = createViewFn({
          schema: {
            validators: ['test']
          }
        });
        view.render();
      });

      describe('when validation fails', function () {
        var error = 'This is an error';
        beforeEach(function () {
          view.getValidator = function () {
            return function () {
              return error;
            };
          };
        });

        it('should call setError', function () {
          spyOn(view, 'setError');

          view.validate();

          expect(view.setError).toHaveBeenCalled();
        });

        it('should return the error', function () {
          expect(view.validate()).toEqual(error);
        });
      });

      describe('when validation succeds', function () {
        beforeEach(function () {
          view.getValidator = function () {
            return function () {
              return false;
            };
          };
        });

        it('should call clearError', function () {
          spyOn(view, 'clearError');

          view.validate();

          expect(view.clearError).toHaveBeenCalled();
        });

        it('should return null', function () {
          expect(view.validate()).toBeNull();
        });
      });
    });
  });

  describe('.setError', function () {
    var error = 'This is an error';
    beforeEach(function () {
      view = createViewFn();
      view.render();
      view.setError({
        message: error
      });
    });

    it('should add the error class to the element', function () {
      expect(view.$el.hasClass('error')).toBe(true);
    });

    it('should set the error to the title attribute', function () {
      expect(view.$el.attr('title')).toEqual(error);
    });
  });

  describe('with custom error class', function () {
    var errorClass = 'myCustomError';
    var errorMessage = 'This is an error';

    beforeEach(function () {
      view = createViewFn({
        errorClassName: errorClass
      });
      view.render();
      view.setError({
        message: errorMessage
      });
    });

    describe('.setError', function () {
      it('should add the error class to the element', function () {
        expect(view.$el.hasClass(errorClass)).toBe(true);
      });
    });

    describe('.clearError', function () {
      it('should remove the error class from the element', function () {
        expect(view.$el.hasClass(errorClass)).toBe(true);
        view.clearError();
        expect(view.$el.hasClass(errorClass)).toBe(false);
      });

      it('should remove the error from the title attribute', function () {
        view.clearError();
        expect(view.$el.attr('title')).toBeUndefined();
      });
    });
  });

  describe('.clearError', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
      view.setError({
        message: 'error'
      });
    });

    it('should add the error class to the element', function () {
      expect(view.$el.hasClass('error')).toBe(true);
      view.clearError();
      expect(view.$el.hasClass('error')).toBe(false);
    });

    it('should set the error to the title attribute', function () {
      view.clearError();
      expect(view.$el.attr('title')).toBeUndefined();
    });
  });

  describe('.remove', function () {
    it('should call _removeTooltip', function () {
      spyOn(view, '_removeTooltip');
      view.remove();

      expect(view._removeTooltip).toHaveBeenCalled();
    });

    it('should call editor.remove', function () {
      spyOn(view.editor, 'remove');
      view.remove();

      expect(view.editor.remove).toHaveBeenCalled();
    });
  });

  it('should have no leaks', function () {
    view = createViewFn();
    view.render();
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.remove();
  });
});
