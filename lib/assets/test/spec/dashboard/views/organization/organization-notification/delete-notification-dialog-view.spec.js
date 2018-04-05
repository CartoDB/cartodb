const RemoveNotificationDialog = require('dashboard/views/organization/organization-notification/delete-notification-dialog-view');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

describe('organization/organization-notification/delete-notification-dialog-view', function () {
  beforeEach(function () {
    spyOn(RemoveNotificationDialog.prototype, '_onSubmit').and.callFake(
      function (event) { event.preventDefault(); }
    );

    this.view = new RemoveNotificationDialog({
      userModel: new UserModelFixture(),
      modalModel: {
        destroy: jasmine.createSpy('destroy')
      },
      authenticityToken: 'i_am_a_token',
      notificationId: 1337
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.text()).toContain('You are about to remove a notification');
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });

  describe('when click OK', function () {
    beforeEach(function () {
      this.view.$('.js-submit').click();
    });

    it('should show loading dialog, submit form, and close dialog', function () {
      expect(this.view._onSubmit).toHaveBeenCalled();
    });
  });

  describe('when click back', function () {
    beforeEach(function () {
      this.view.$('.js-cancel').click();
    });

    it('should close this dialog', function () {
      expect(this.view._modalModel.destroy).toHaveBeenCalled();
    });
  });
});
