var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var AccountFormView = require('../../../../javascripts/cartodb/account/account_form_view');
var CartoNode = require('../../../../../../vendor/assets/javascripts/carto-node/carto-node');

var BASE_URL = 'https://matallo.carto.com';
var USERNAME = 'pepe';
var EMAIL = 'pepe@carto.com';
var PLAN_NAME = '[DEDICATED]';
var PLAN_URL = 'http://carto.com/account/pepe/plan';

window.StaticConfig = {
  baseUrl: BASE_URL
};
describe('account/account_form_view', function () {

  beforeEach(function () {
    var client = new CartoNode.AuthenticatedClient();

    jasmine.Ajax.install();

    this.user = new cdb.admin.User({
      username: USERNAME,
      base_url: 'http://pepe.carto.com',
      email: EMAIL,
      account_type: 'FREE',
      plan_name: PLAN_NAME,
      plan_url: PLAN_URL
    });

    this.setLoadingSpy = jasmine.createSpy('setLoading');
    this.showSuccessSpy = jasmine.createSpy('showSuccess');
    this.showErrorsSpy = jasmine.createSpy('showErrors');

    this.model = new cdb.core.Model();

    this.view = new AccountFormView({
      user: this.user,
      setLoading: this.setLoadingSpy,
      onSuccess: this.showSuccessSpy,
      onError: this.showErrorsSpy,
      renderModel: this.model,
      client: client
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<form accept-charset="UTF-8">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="user_username" name="user[username]" readonly="readonly" size="30" type="text" value="' + USERNAME + '">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  is-disabled" id="user_email" name="user[email]" size="30" type="text" value="' + EMAIL + '" readonly="readonly">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" readonly="readonly">');
      expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="confirm_password" name="user[confirm_password]" size="30" type="password" readonly="readonly">');
      expect(this.view.$el.html()).toContain('<div class="FormAccount-footer ">');
      expect(this.view.$el.html()).toContain('<p class="FormAccount-footerText"></p>');
      expect(this.view.$el.html()).toContain('<span class="FormAccount-button--deleteAccount CDB-Size-medium js-deleteAccount">account.views.form.delete_all</span>');
    });
  });

  describe('errors', function () {
    describe('email', function () {
      describe('.render', function () {
        it('should render properly', function () {
          this.view._errors = {
            email: ['error']
          };

          this.view.render();

          expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_email" name="user[email]" size="30" type="text" value="' + EMAIL + '" readonly="readonly">');
        });
      });
    });

    describe('new_password', function () {
      describe('.render', function () {
        it('should render properly', function () {
          this.view._errors = {
            new_password: ['error']
          };

          this.view.render();

          expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" readonly="readonly">');
          expect(this.view.$el.html()).toContain('<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace">error</p>');
        });
      });
    });
  });

  describe('should display old password', function () {
    beforeEach(function () {
      this.user.set('should_display_old_password', true);
      this.user.set('auth_username_password_enabled', true);
    });

    describe('errors', function () {
      describe('old_password', function () {
        describe('.render', function () {
          it('should render properly', function () {
            this.view._errors = {
              old_password: ['error']
            };

            this.view.render();

            expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_old_password" name="user[old_password]" size="30" type="password" readonly="readonly">');
            expect(this.view.$el.html()).toContain('<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace">error</p>');
          });
        });
      });
    });

    describe('._oldPassword', function () {
      it('should return user old password', function () {
        this.view.render();

        var OLD_PASSWORD = '123456';
        this.view.$('#user_old_password').val(OLD_PASSWORD);

        expect(this.view._oldPassword()).toBe(OLD_PASSWORD);
      });
    });

    describe('can change password', function () {
      beforeEach(function () {
        this.user.set('can_change_password', true);
      });

      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_old_password" name="user[old_password]" size="30" type="password">');
        });
      });
    });
  });

  describe('can change email', function () {
    beforeEach(function () {
      this.user.set('can_change_email', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_email" name="user[email]" size="30" type="text" value="' + EMAIL + '">');
      });
    });
  });

  describe('can change password', function () {
    beforeEach(function () {
      this.user.set('can_change_password', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_new_password" name="user[new_password]" size="30" type="password">');
        expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med " id="confirm_password" name="user[confirm_password]" size="30" type="password">');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      this.user.isInsideOrg = function () { return true; };
      this.user.organization = new cdb.core.Model({
        name: 'carto'
      });

      this.user.organization.owner = new cdb.core.Model({
        email: EMAIL
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).not.toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_new_password" name="user[new_password]" size="30" type="password">');
        expect(this.view.$el.html()).not.toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med " id="confirm_password" name="user[confirm_password]" size="30" type="password">');
      });
    });

    describe('is auth username password enabled', function () {
      beforeEach(function () {
        this.user.set('auth_username_password_enabled', true);
      });

      describe('should display old password', function () {
        beforeEach(function () {
          this.user.set('should_display_old_password', true);
        });

        describe('errors', function () {
          describe('old_password', function () {
            describe('.render', function () {
              it('should render properly', function () {
                this.view._errors = {
                  old_password: ['error']
                };

                this.view.render();

                expect(this.view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_old_password" name="user[old_password]" size="30" type="password" readonly="readonly">');
                expect(this.view.$el.html()).toContain('<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace">error</p>');
              });
            });
          });
        });
      });
    });

    describe('is org owner', function () {
      beforeEach(function () {
        this.user.isOrgOwner = function () { return true; };

        this.user.organization = new cdb.core.Model({
          id: 1,
          name: 'carto'
        });

        this.user.organization.owner = new cdb.core.Model({
          email: 'owner@cartao.com'
        });
      });

      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).toContain('<div class="FormAccount-planTag CDB-Size-medium">' + PLAN_NAME + '</div>');
          expect(this.view.$el.html()).toContain('<p class="FormAccount-rowInfoText CDB-Size-medium"><a href="' + PLAN_URL + '" class="FormAccount-link">account.views.form.view_details</a></p>');
        });
      });
    });
  });

  describe('services', function () {
    beforeEach(function () {
      this.user.set('services', [{
        connected: false,
        name: 'dropbox',
        revoke_url: null,
        title: 'Dropbox'
      }]);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('<div class="js-datasourcesContent"></div>');
      });
    });

    describe('._initViews', function () {
      it('should init views', function () {
        this.view.render();

        expect(_.size(this.view._subviews)).toBe(1);
      });
    });
  });

  describe('cant be deleted reason', function () {
    beforeEach(function () {
      this.user.set('cant_be_deleted_reason', 'reason');
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).toContain('<div class="FormAccount-footer FormAccount-footer--noMarginBottom">');
        expect(this.view.$el.html()).toContain('<span>reason</span>');
      });
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view._errors).toEqual({});
      expect(this.view._userModel).toEqual(this.user);
      expect(this.view._renderModel).toEqual(this.model);
    });
  });

  describe('._getField', function () {
    it('should get field', function () {
      expect(this.view._getField('username')).toBe(USERNAME);
    });
  });

  describe('._getUserFields', function () {
    it('should get user fields', function () {
      expect(this.view._getUserFields()).toEqual({
        username: USERNAME,
        email: EMAIL
      });
    });
  });

  describe('._getDestinationValues', function () {
    it('should get destination values', function () {
      var destUsername = '_description';
      var destEmail = '_avatar_url';
      var destOldPassword = '_name';
      var destNewPassword = '_last_name';
      var destConfirmPassword = '_location';

      spyOn(this.view, '_username').and.returnValue(destUsername);
      spyOn(this.view, '_email').and.returnValue(destEmail);
      spyOn(this.view, '_oldPassword').and.returnValue(destOldPassword);
      spyOn(this.view, '_newPassword').and.returnValue(destNewPassword);
      spyOn(this.view, '_confirmPassword').and.returnValue(destConfirmPassword);

      expect(this.view._getDestinationValues()).toEqual({
        username: destUsername,
        email: destEmail,
        old_password: destOldPassword,
        new_password: destNewPassword,
        confirm_password: destConfirmPassword
      });
    });
  });

  describe('._onClickSave', function () {
    it('should save user', function () {
      var destEmail = 'carlos@carto.com';
      var event = $.Event('click');

      spyOn(this.view, 'killEvent');
      spyOn(this.view, '_getUserFields').and.returnValue({
        email: EMAIL
      });
      spyOn(this.view, '_getDestinationValues').and.returnValue({
        email: destEmail
      });
      spyOn(this.view._userModel, 'save');

      this.view._onClickSave(event);

      expect(this.view.killEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('._username', function () {
    it('should return user username', function () {
      this.view.render();

      expect(this.view._username()).toBe(USERNAME);
    });
  });

  describe('._email', function () {
    it('should return user email', function () {
      this.view.render();

      expect(this.view._email()).toBe(EMAIL);
    });
  });

  describe('._newPassword', function () {
    it('should return user new password', function () {
      this.view.render();

      var NEW_PASSWORD = '123456';
      this.view.$('#user_new_password').val(NEW_PASSWORD);

      expect(this.view._newPassword()).toBe(NEW_PASSWORD);
    });
  });

  describe('._confirmPassword', function () {
    it('should return user confirm password', function () {
      this.view.render();

      var CONFIRM_PASSWORD = '123456';
      this.view.$('#confirm_password').val(CONFIRM_PASSWORD);

      expect(this.view._confirmPassword()).toBe(CONFIRM_PASSWORD);
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
