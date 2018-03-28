const $ = require('jquery');
const _ = require('underscore');
const OrganizationNotificationView = require('dashboard/views/organization/organization-notification/organization-notification-view');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

describe('organization/organization_notification/organization_notification_view', function () {
  beforeEach(function () {
    this.view = new OrganizationNotificationView({
      el: `
        <div>
          <form>
            <textarea id="carto_notification_body" name="carto_notification[body]" class="js-textarea">title</textarea>
            <input type="radio" name="carto_notification[recipients]" value="all" checked="checked">
            <input type="radio" name="carto_notification[recipients]" value="builders">
          </form>
          <div class="js-NotificationsList-item">
            <div class="js-recipients" data-recipients="builders"></div>
            <div class="js-html_body" data-body="**title** _title_ [title](http://title.com/)">
              <strong>title</strong> <em>title</em> <a href="http://title.com/">title</a>
            </div>
            <button class="js-resend"></button>
            <button class="js-remove"></button>
          </div>
        </div>
      `,
      userModel: new UserModelFixture(),
      authenticityToken: 'i_am_a_token'
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    // The Dialog closing action occurs within a 120ms delay, so we
    // remove it manually instead of waiting for the dialog to close
    var dialog = document.querySelector('.Dialog');

    if (dialog) {
      dialog.remove();
    }

    this.view.clean();
  });

  describe('._onClickRemove', function () {
    it('should render properly', function () {
      expect($('.Dialog').html()).not.toContain('Are you sure you want to remove it?');

      this.view.$el.find('.js-remove').data('id', 1337);
      this.view.$el.find('.js-remove').click();

      expect($('.Dialog').html()).toContain('Are you sure you want to remove it?');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('._onClickResend', function () {
    it('should check the type and copy the body', function () {
      spyOn(this.view.sendButton, 'updateCounter');

      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="all"]').prop('checked')).toBe(true);
      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="builders"]').prop('checked')).toBe(false);

      this.view.$('.js-resend').click();

      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="all"]').prop('checked')).toBe(false);
      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="builders"]').prop('checked')).toBe(true);
      expect(this.view.$el.find('#carto_notification_body').val()).toBe('**title** _title_ [title](http://title.com/)');
      expect(this.view.sendButton.updateCounter).toHaveBeenCalledWith(17);
    });
  });

  describe('._updateCounter', function () {
    it('should update counter', function () {
      spyOn(this.view.sendButton, 'updateCounter');

      this.view.$el.find('#carto_notification_body').trigger('input');

      expect(this.view.sendButton.updateCounter).toHaveBeenCalledWith(5);
    });
  });

  describe('._onTextareaKeydown', function () {
    it('should submit update', function () {
      spyOn(this.view.sendButton, 'onUpdate');

      const event = $.Event('keydown');
      event.key = 'Enter';
      event.metaKey = true;

      this.view.$el.find('#carto_notification_body').trigger(event);

      expect(this.view.sendButton.onUpdate).toHaveBeenCalled();
    });
  });
});
