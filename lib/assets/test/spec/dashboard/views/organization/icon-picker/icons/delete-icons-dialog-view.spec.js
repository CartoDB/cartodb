const DeleteIconsDialogView = require('dashboard/views/organization/icon-picker/icons/delete-icons-dialog-view');
const deleteIconsDialogTemplate = require('dashboard/views/organization/icon-picker/icons/delete-icons-dialog.tpl');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('organization/icon-picker/icons/delete-icons-dialog-view', function () {
  let view;

  function createViewFn (options) {
    const viewOptions = {
      numOfIcons: 5,
      okCallback: function () { },
      configModel,
      onSubmit: jasmine.createSpy('onSubmit'),
      template: deleteIconsDialogTemplate,
      modalModel: {
        destroy: jasmine.createSpy('destroy')
      },
      ...options
    };

    return new DeleteIconsDialogView(viewOptions);
  }

  describe('render', function () {
    it('should render properly when several icons', function () {
      view = createViewFn({ numOfIcons: 5 });

      view.render();

      expect(view.$('.Badge').text()).toEqual('5');
      expect(view.$('h4').text()).toContain('5 icons');
      expect(view.$('.Dialog-header p').text()).toContain('these icons');
    });

    it('should render properly when only 1 icon', function () {
      view = createViewFn({ numOfIcons: 1 });

      view.render();

      expect(view.$('.Badge').text()).toEqual('1');
      expect(view.$('h4').text()).toContain('1 icon');
      expect(view.$('.Dialog-header p').text()).toContain('this icon');
      expect(view.$('.Dialog-header p').text()).not.toContain('these icons');
    });

    it('should render properly when no icon', function () {
      view = createViewFn({ numOfIcons: 0 });

      view.render();

      expect(view.$('.Badge').length).toBe(0);
      expect(view.$('h4').text()).toContain('icons');
      expect(view.$('.Dialog-header p').text()).toContain('these icons');
    });

    it('should have no leaks', function () {
      view = createViewFn({ numOfIcons: 5 });

      expect(view).toHaveNoLeaks();
    });
  });

  describe('ok', function () {
    it('should call `_onSubmit` callback and close', function () {
      view = createViewFn({ numOfIcons: 5 });

      spyOn(view, '_closeDialog');

      view._onSubmitClicked();

      expect(view._onSubmit).toHaveBeenCalled();
      expect(view._closeDialog).toHaveBeenCalled();
    });
  });
});
