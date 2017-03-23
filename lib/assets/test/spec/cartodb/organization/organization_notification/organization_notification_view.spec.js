var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var OrganizationNotificationView = require('../../../../../javascripts/cartodb/organization/organization_notification/organization_notification_view');

describe('organization/organization_notification/organization_notification_view', function () {
  beforeEach(function () {
    this.view = new OrganizationNotificationView({
      el: $([
        '<form>',
        '<textarea id="carto_notification_body" name="carto_notification[body]" class="js-textarea">title</textarea>',
        '<input type="radio" name="carto_notification[recipients]" value="all" checked="checked">',
        '<input type="radio" name="carto_notification[recipients]" value="builders">',
        '</form>',
        '<div class="js-NotificationsList-item">',
        '<div class="js-recipients" data-recipients="builders"></div>',
        '<div class="js-html_body" data-body="**title** _title_ [title](http://title.com/)">',
        '<strong>title</strong> <em>title</em> <a href="http://title.com/">title</a>',
        '</div>',
        '<button class="js-resend"></button>',
        '<button class="js-remove"></button>',
        '</div>'
      ].join(''))
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
    this.view.clean();
  });

  describe('._onClickRemove', function () {
    it('should render properly', function () {
      expect(this.view.remove_notification_dialog).not.toBeDefined();

      this.view.$el.find('.js-remove').click();

      expect(this.view.remove_notification_dialog).toBeDefined();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('._onClickResend', function () {
    it('should check the type and copy the body', function () {
      spyOn(this.view.sendButton, 'updateCounter');

      expect(this.view.$el.find('input[name=carto_notification[recipients]][value="all"]').prop('checked')).toBe(true);
      expect(this.view.$el.find('input[name=carto_notification[recipients]][value="builders"]').prop('checked')).toBe(false);

      this.view.$('.js-resend').click();

      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="all"]').prop('checked')).toBe(false);
      expect(this.view.$el.find('input[name="carto_notification[recipients]"][value="builders"]').prop('checked')).toBe(true);
      expect(this.view.$el.find('#carto_notification_body').val()).toBe('**title** _title_ [title](http://title.com/)');
      expect(this.view.sendButton.updateCounter).toHaveBeenCalledWith(17);
    });
  });

  describe('._onTextareaKeyup', function () {
    it('should update counter', function () {
      spyOn(this.view.sendButton, 'updateCounter');

      this.view.$el.find('#carto_notification_body').trigger('keyup');

      expect(this.view.sendButton.updateCounter).toHaveBeenCalledWith(5);
    });
  });
});
