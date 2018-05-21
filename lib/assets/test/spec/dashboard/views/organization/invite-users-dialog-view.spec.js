const Backbone = require('backbone');
const InviteUsersDialogView = require('dashboard/views/organization/invite-users/invite-users-dialog-view');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('organization/invite-users/invite-users-dialog-view', function () {
  beforeEach(function () {
    const userModel = new UserModelFixture();
    const modalModel = new Backbone.Model();
    modalModel.destroy = jasmine.createSpy('destroy');

    this.org = new Backbone.Model({ id: 'pacoOrg' });
    this.orgUsers = new Backbone.Collection(null, { organization: this.org });

    this.view = new InviteUsersDialogView({
      configModel,
      userModel,
      modalModel,
      organization: this.org,
      organizationUsers: this.orgUsers
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._panes).toBeDefined();
    expect(this.view._panes.size()).toBe(3);
  });

  describe('form view', function () {
    beforeEach(function () {
      this.formView = this.view._panes.getPane('form');
      this.$form = this.view.$('.js-form');
    });

    it('should render tag input and welcome textarea', function () {
      expect(this.$form.find('.js-tagsList').length).toBe(1);
      expect(this.$form.find('.js-welcomeText').length).toBe(1);
    });

    it('should enable submit button when welcome_text and any email is added', function () {
      var $button = this.$form.find('.js-submit');
      this.formView.model.set('users_emails', ['paco@gmail.com']);
      this.formView._onChange();
      expect($button.hasClass('is-disabled')).toBeFalsy();
    });

    it('should render enable signup message if org signup is disabled', function () {
      this.formView.model.set('enable_organization_signup', true);
      expect(this.$form.find('.js-signInMessage').length).toBe(1);
    });

    it('should set to true the model enable_organization_signup attribute', function () {
      var $button = this.$form.find('.js-enableSignInButton');
      $button.click();
      expect(this.formView.model.get('enable_organization_signup')).toBe(true);
    });
  });

  describe('form view submission', function () {
    beforeEach(function () {
      this.formView = this.view._panes.getPane('form');
      this.$form = this.view.$('.js-invitesForm');

      spyOn(this.formView, 'trigger').and.callThrough();
    });

    it('should not submit the form if button is disabled', function () {
      expect(this.$form.find('.js-submit').hasClass('is-disabled')).toBeTruthy();
      this.$form.submit();
      expect(this.formView.trigger).not.toHaveBeenCalled();
    });

    it('should send a trigger when form is submitted correctly', function () {
      this.formView.model.set('users_emails', ['paco@gmail.com']);
      this.$form.submit();
      expect(this.formView.trigger).toHaveBeenCalled();
    });
  });

  describe('on save', function () {
    it('should show loading state when model is being saved', function () {
      this.view.model.sync = function () { };
      this.view.model.set('users_emails', ['paco@gmail.com']);
      this.view._sendInvites();
      expect(this.view._panes.activeTab).toBe('loading');
    });

    it('should show close the dialog when model is properly saved', function () {
      this.view.model.sync = function (a, b, callback) {
        callback.success();
      };

      this.view._sendInvites();

      expect(this.view._modalModel.destroy).toHaveBeenCalled();
    });

    it('should show error state when model saved has any problem', function () {
      this.view.model.sync = function (a, b, c) {
        c.error();
      };
      this.view._sendInvites();
      expect(this.view._panes.activeTab).toBe('error');
    });
  });
});
