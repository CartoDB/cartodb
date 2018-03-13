const Backbone = require('backbone');
const AlertDialogView = require('dashboard/views/api-keys/alert-dialog-view');

describe('dashboard/views/api-keys/alert-dialog-view', function () {
  let view;

  const createViewFn = function (options) {
    const viewOptions = Object.assign({}, {
      modalModel: new Backbone.Model(),
      onSubmit: jasmine.createSpy('onSubmit'),
      template: jasmine.createSpy('template')
    }, options);

    const view = new AlertDialogView(viewOptions);
    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  it('throws an error when modalModel is missing', function () {
    view = function () {
      return createViewFn({
        modalModel: undefined
      });
    };

    expect(view).toThrowError('modalModel is required');
  });

  it('throws an error when onSubmit is missing', function () {
    view = function () {
      return createViewFn({
        onSubmit: undefined
      });
    };

    expect(view).toThrowError('onSubmit is required');
  });

  it('throws an error when template is missing', function () {
    view = function () {
      return createViewFn({
        template: undefined
      });
    };

    expect(view).toThrowError('template is required');
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();
      expect(view._template).toHaveBeenCalled();
    });
  });

  describe('._onSubmitClicked', function () {
    it('should call ._onSubmit', function () {
      view._onSubmitClicked();
      expect(view._onSubmit).toHaveBeenCalled();
    });

    it('should call ._closeDialog', function () {
      spyOn(view, '_closeDialog');
      view._onSubmitClicked();
      expect(view._closeDialog).toHaveBeenCalled();
    });
  });

  describe('._closeDialog', function () {
    it('should destroy modalModel', function () {
      spyOn(view._modalModel, 'destroy');
      view._closeDialog();
      expect(view._modalModel.destroy).toHaveBeenCalled();
    });
  });
});
