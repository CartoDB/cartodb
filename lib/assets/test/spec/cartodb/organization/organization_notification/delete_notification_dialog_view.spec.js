var $ = require('jquery-cdb-v3');
var RemoveNotificationDialog = require('../../../../../javascripts/cartodb/organization/organization_notification/delete_notification_dialog_view');

describe('organization/organization_notification/delete_notification_dialog_view', function () {
  beforeEach(function () {
    this.view = new RemoveNotificationDialog();
    spyOn(this.view, 'submit');
    spyOn(this.view, '_cancel');

    this.view.undelegateEvents();
    this.view.delegateEvents();
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
      this.view.$('.js-ok').click();
    });

    it('should show loading dialog, submit form, and close dialog', function () {
      expect($('.Dialog').text()).toContain('Removing');

      expect(this.view.submit).toHaveBeenCalled();
      expect(this.view._cancel).toHaveBeenCalled();
    });
  });

  describe('when click back', function () {
    beforeEach(function () {
      this.view.$('.js-cancel').click();
    });

    it('should close this dialog', function () {
      expect(this.view._cancel).toHaveBeenCalled();
    });
  });
});
