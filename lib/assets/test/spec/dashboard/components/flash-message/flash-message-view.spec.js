const FlashMessageModel = require('dashboard/data/flash-message-model');
const FlashMessageView = require('dashboard/components/flash-message/flash-message-view');

describe('dashboard/components/flash-message/flash-message-view', function () {
  let model, view;

  const createViewFn = function () {
    model = new FlashMessageModel();

    const view = new FlashMessageView({ model });
    return view;
  };

  beforeEach(function () {
    view = createViewFn();
    view.render();
  });

  it('should not display the view since there is no message', function () {
    expect(view.el.outerHTML).toContain('display: none');
  });

  describe('when model.show is called', function () {
    beforeEach(function () {
      model.show('ERR!', 'error');
    });

    it('should show view', function () {
      expect(view.el.outerHTML).not.toContain('display: none');
      expect(view.el.outerHTML).toContain('ERR!');
      expect(view.el.outerHTML).toContain('FlashMessage--error');
    });

    it('should update view', function () {
      expect(view.el.outerHTML).toContain('ERR!');
      expect(view.el.outerHTML).toContain('FlashMessage--error');

      model.show('SUCCESS!', 'success');

      expect(view.el.outerHTML).toContain('SUCCESS!');
      expect(view.el.outerHTML).toContain('FlashMessage--success');
    });

    describe('when model.hide is called', function () {
      beforeEach(function () {
        model.hide();
      });

      it('should hide view', function () {
        expect(view.el.outerHTML).toContain('display: none');
      });
    });
  });
});
