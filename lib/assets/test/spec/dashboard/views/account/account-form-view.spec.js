const $ = require('jquery');
const Backbone = require('backbone');
const CartoNode = require('carto-node');
const AccountFormView = require('dashboard/views/account/account-form-view');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');

const modals = new ModalsServiceModel();

const BASE_URL = 'https://matallo.carto.com';
const USERNAME = 'pepe';
const EMAIL = 'pepe@carto.com';
const PLAN_NAME = '[DEDICATED]';
const PLAN_URL = 'http://carto.com/account/pepe/plan';
const ENABLED = 'account.views.form.mfa_enabled';
const DISABLED = 'account.views.form.mfa_disabled';
const PASSWORD = 'password';

window.StaticConfig = {
  baseUrl: BASE_URL
};

describe('dashboard/views/account/account-form-view', function () {
  const client = new CartoNode.AuthenticatedClient();
  let userModel, configModel, setLoadingSpy, showSuccessSpy, showErrorsSpy, model, view;
  const fakeLicenseExpiration = '2020-11-05T00:00:00.000+00:00';
  const expectedLicenseOutput = '5th November 2020';

  const createViewFn = function (showPasswordModal = 'auto', licenseExpiration = fakeLicenseExpiration) {
    if (showPasswordModal === 'auto') {
      spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
        function (options) {
          options.onPasswordTyped && options.onPasswordTyped(PASSWORD);
        }
      );
    }

    userModel = new UserModel({
      username: USERNAME,
      base_url: 'http://pepe.carto.com',
      account_type: 'FREE',
      plan_name: PLAN_NAME,
      plan_url: PLAN_URL,
      mfa_configured: false,
      needs_password_confirmation: true,
      license_expiration: licenseExpiration
    });

    userModel.featureEnabled = function () { return true; };

    configModel = ConfigModelFixture;

    setLoadingSpy = jasmine.createSpy('setLoading');
    showSuccessSpy = jasmine.createSpy('showSuccess');
    showErrorsSpy = jasmine.createSpy('showErrors');

    model = new Backbone.Model();

    const view = new AccountFormView({
      userModel,
      configModel,
      setLoading: setLoadingSpy,
      onSuccess: showSuccessSpy,
      onError: showErrorsSpy,
      renderModel: model,
      client,
      modals
    });

    return view;
  };

  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view.$el.html()).toContain('<form accept-charset="UTF-8">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="user_username" name="user[username]" readonly="readonly" size="30" type="text" value="' + USERNAME + '">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" autocomplete="off" readonly="readonly">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="confirm_password" name="user[confirm_password]" size="30" type="password" autocomplete="off" readonly="readonly">');
      expect(view.$el.html()).toContain('<input class="js-toggle-mfa" id="mfa" name="user[mfa]" type="checkbox" value="1">');
      expect(view.$el.html()).toContain('<div class="FormAccount-footer ">');
      expect(view.$el.html()).toContain('<p class="FormAccount-footerText"></p>');
      expect(view.$el.html()).toContain('<span class="FormAccount-button--deleteAccount CDB-Size-medium js-deleteAccount">account.views.form.delete_all</span>');
    });
  });

  describe('errors', function () {
    describe('new_password', function () {
      describe('.render', function () {
        it('should render properly', function () {
          view = createViewFn();
          view._errors = {
            new_password: ['error']
          };

          view.render();

          expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" autocomplete="off" readonly="readonly">');
          expect(view.$el.html()).toContain('<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace">error</p>');
        });
      });
    });
  });

  describe('can change password', function () {
    beforeEach(function () {
      view = createViewFn();
      userModel.set('can_change_password', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_new_password" name="user[new_password]" size="30" type="password" autocomplete="off">');
        expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med " id="confirm_password" name="user[confirm_password]" size="30" type="password" autocomplete="off">');
      });
    });
  });

  describe('is inside org', function () {
    describe('with a valid license', function () {
      beforeEach(function () {
        view = createViewFn();
        userModel.isInsideOrg = function () { return true; };
        userModel.isOrgAdmin = function () { return false; };

        userModel.organization = new Backbone.Model({
          name: 'carto'
        });

        userModel.organization.owner = new Backbone.Model({
          email: EMAIL
        });
      });

      describe('.render', function () {
        it('should render properly', function () {
          view.render();

          expect(view.$el.html()).not.toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_new_password" name="user[new_password]" size="30" type="password">');
          expect(view.$el.html()).not.toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med " id="confirm_password" name="user[confirm_password]" size="30" type="password">');
        });
      });

      describe('with cartodb hosted', function () {
        beforeEach(function () {
          configModel.isHosted = function () { return true; };
          userModel.isOrgOwner = function () { return false; };
        });

        it('should render properly', function () {
          view.render();
          expect(view.$el.html()).not.toContain('license-expiration');
        });
      });

      describe('is org owner', function () {
        beforeEach(function () {
          configModel.isHosted = function () { return false; };
          userModel.isOrgOwner = function () { return true; };

          userModel.organization = new Backbone.Model({
            id: 1,
            name: 'carto'
          });

          userModel.organization.owner = new Backbone.Model({
            email: 'owner@cartao.com'
          });
        });

        describe('.render', function () {
          it('should render properly', function () {
            view.render();

            expect(view.$el.html()).toContain('<div class="FormAccount-planTag CDB-Size-medium">' + PLAN_NAME + '</div>');
            expect(view.$el.html()).toContain('<p class="FormAccount-rowInfoText CDB-Size-medium"><a href="' + PLAN_URL + '" class="FormAccount-link">account.views.form.view_details</a></p>');
          });
        });

        describe('with cartodb hosted', function () {
          beforeEach(function () {
            configModel.isHosted = function () { return true; };
          });

          it('should render properly', function () {
            view.render();
            expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="license-expiration" name="license-expiration" readonly="readonly" size="30" type="text" value="' + expectedLicenseOutput + '">');
            expect(view.$el.html()).toContain('<p class="CDB-Text CDB-Size-small u-altTextColor">account.views.form.license_renew_info</p>');
          });
        });
      });

      describe('is org admin', function () {
        beforeEach(function () {
          configModel.isHosted = function () { return false; };
          userModel.isOrgOwner = function () { return false; };
          userModel.isOrgAdmin = function () { return true; };
        });

        describe('.render', function () {
          it('should render properly', function () {
            view.render();

            expect(view.$el.html()).not.toContain('license-expiration');
          });
        });

        describe('with cartodb hosted', function () {
          beforeEach(function () {
            configModel.isHosted = function () { return true; };
          });

          it('should render properly', function () {
            view.render();
            expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="license-expiration" name="license-expiration" readonly="readonly" size="30" type="text" value="' + expectedLicenseOutput + '">');
            expect(view.$el.html()).toContain('<p class="CDB-Text CDB-Size-small u-altTextColor">account.views.form.license_renew_info</p>');
          });
        });
      });
    });

    describe('without a license', function () {
      beforeEach(function () {
        view = createViewFn('auto', null);
        configModel.isHosted = function () { return true; };
        userModel.isInsideOrg = function () { return true; };
        userModel.isOrgOwner = function () { return true; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          view.render();
          expect(view.$el.html()).not.toContain('license-expiration');
        });
      });
    });

    describe('with an invalid license', function () {
      beforeEach(function () {
        view = createViewFn('auto', 'wrong');
        configModel.isHosted = function () { return true; };
        userModel.isInsideOrg = function () { return true; };
        userModel.isOrgOwner = function () { return true; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          view.render();
          expect(view.$el.html()).not.toContain('license-expiration');
        });
      });
    });
  });

  describe('services', function () {
    beforeEach(function () {
      view = createViewFn();
      userModel.set('services', [{
        connected: false,
        name: 'dropbox',
        revoke_url: null,
        title: 'Dropbox'
      }]);
    });
  });

  describe('cant be deleted reason', function () {
    describe('.render', function () {
      it('should render properly', function () {
        view = createViewFn();
        userModel.set('cant_be_deleted_reason', 'reason');
        view.render();

        expect(view.$el.html()).toContain('<div class="FormAccount-footer FormAccount-footer--noMarginBottom">');
        expect(view.$el.html()).toContain('<span>reason</span>');
      });
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      view = createViewFn();
      expect(view._errors).toEqual({});
      expect(view._userModel).toEqual(userModel);
      expect(view._renderModel).toEqual(model);
    });
  });

  describe('._getField', function () {
    it('should get field', function () {
      view = createViewFn();
      expect(view._getField('username')).toBe(USERNAME);
    });
  });

  describe('._getUserFields', function () {
    it('should get user fields', function () {
      view = createViewFn();
      expect(view._getUserFields()).toEqual({
        username: USERNAME
      });
    });
  });

  describe('._getDestinationValues', function () {
    it('should get destination values', function () {
      view = createViewFn();
      var destUsername = '_description';
      var destNewPassword = '_last_name';
      var destConfirmPassword = '_location';
      var destMfa = '_mfa';

      spyOn(view, '_username').and.returnValue(destUsername);
      spyOn(view, '_newPassword').and.returnValue(destNewPassword);
      spyOn(view, '_confirmPassword').and.returnValue(destConfirmPassword);
      spyOn(view, '_mfaStatus').and.returnValue(destMfa);

      expect(view._getDestinationValues()).toEqual({
        username: destUsername,
        new_password: destNewPassword,
        confirm_password: destConfirmPassword,
        mfa: destMfa
      });
    });
  });

  describe('._onClickSave', function () {
    it('should save user', function () {
      view = createViewFn();
      view.render();
      var event = $.Event('click');

      spyOn(view, 'killEvent');
      spyOn(view._userModel, 'save');

      view._onClickSave(event);

      expect(view.killEvent).toHaveBeenCalledWith(event);
    });

    it('shows a password confirmation modal when needs_password_confirmation is true', function () {
      view = createViewFn();
      view.render();
      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();
    });

    it('shows a password confirmation modal with updatePassword to true if the password fields have changed', function () {
      var NEW_PASSWORD = 'new_password';

      spyOn(PasswordValidatedForm, 'showPasswordModal');

      view = createViewFn('custom');
      view.render();

      view.$('#user_new_password').val(NEW_PASSWORD);
      view.$('#confirm_password').val(NEW_PASSWORD);
      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalledWith(jasmine.objectContaining({
        updatePassword: true
      }));
    });

    it('bypasses the password confirmation when needs_password_confirmation is false', function () {
      view = createViewFn();
      PasswordValidatedForm.showPasswordModal.calls.reset();
      userModel.set('needs_password_confirmation', false);
      view.render();

      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
    });
  });

  describe('._onToggleMfa', function () {
    it('should change the multifactor authentication checkbox label', function () {
      view = createViewFn();
      view.render();
      expect(view._mfaLabel()[0].innerHTML).toContain(DISABLED);

      spyOn(view, 'killEvent');
      var event = $.Event('change');

      view.$('.js-toggle-mfa').attr('checked', true);
      view._onToggleMfa(event);

      expect(view.killEvent).toHaveBeenCalledWith(event);
      expect(view._mfaLabel()[0].innerHTML).toContain(ENABLED);
    });
  });

  describe('._username', function () {
    it('should return user username', function () {
      view = createViewFn();
      view.render();

      expect(view._username()).toBe(USERNAME);
    });
  });

  describe('._newPassword', function () {
    it('should return user new password', function () {
      view = createViewFn();
      view.render();

      var NEW_PASSWORD = '123456';
      view.$('#user_new_password').val(NEW_PASSWORD);

      expect(view._newPassword()).toBe(NEW_PASSWORD);
    });
  });

  describe('._confirmPassword', function () {
    it('should return user confirm password', function () {
      view = createViewFn();
      view.render();

      var CONFIRM_PASSWORD = '123456';
      view.$('#confirm_password').val(CONFIRM_PASSWORD);

      expect(view._confirmPassword()).toBe(CONFIRM_PASSWORD);
    });
  });

  it('should not have leaks', function () {
    view = createViewFn();
    view.render();

    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
