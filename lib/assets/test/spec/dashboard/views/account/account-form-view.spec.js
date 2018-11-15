const $ = require('jquery');
const _ = require('underscore');
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
  let userModel, setLoadingSpy, showSuccessSpy, showErrorsSpy, model, view;

  const createViewFn = function () {
    userModel = new UserModel({
      username: USERNAME,
      base_url: 'http://pepe.carto.com',
      account_type: 'FREE',
      plan_name: PLAN_NAME,
      plan_url: PLAN_URL,
      multifactor_authentication_configured: false,
      needs_password_confirmation: true
    });

    userModel.featureEnabled = function () { return true; };

    setLoadingSpy = jasmine.createSpy('setLoading');
    showSuccessSpy = jasmine.createSpy('showSuccess');
    showErrorsSpy = jasmine.createSpy('showErrors');

    model = new Backbone.Model();

    const view = new AccountFormView({
      userModel,
      configModel: ConfigModelFixture,
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

    spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped(PASSWORD);
      }
    );

    view = createViewFn();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view.$el.html()).toContain('<form accept-charset="UTF-8">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="user_username" name="user[username]" readonly="readonly" size="30" type="text" value="' + USERNAME + '">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" readonly="readonly">');
      expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" id="confirm_password" name="user[confirm_password]" size="30" type="password" readonly="readonly">');
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
          view._errors = {
            new_password: ['error']
          };

          view.render();

          expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med has-error is-disabled" id="user_new_password" name="user[new_password]" size="30" type="password" readonly="readonly">');
          expect(view.$el.html()).toContain('<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error u-tSpace">error</p>');
        });
      });
    });
  });

  describe('can change password', function () {
    beforeEach(function () {
      userModel.set('can_change_password', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med  " id="user_new_password" name="user[new_password]" size="30" type="password">');
        expect(view.$el.html()).toContain('<input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med " id="confirm_password" name="user[confirm_password]" size="30" type="password">');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      userModel.isInsideOrg = function () { return true; };
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

    describe('is org owner', function () {
      beforeEach(function () {
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
    });
  });

  describe('services', function () {
    beforeEach(function () {
      userModel.set('services', [{
        connected: false,
        name: 'dropbox',
        revoke_url: null,
        title: 'Dropbox'
      }]);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('<div class="js-datasourcesContent"></div>');
      });
    });

    describe('._initViews', function () {
      it('should init views', function () {
        view.render();

        expect(_.size(view._subviews)).toBe(1);
      });
    });
  });

  describe('cant be deleted reason', function () {
    beforeEach(function () {
      userModel.set('cant_be_deleted_reason', 'reason');
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).toContain('<div class="FormAccount-footer FormAccount-footer--noMarginBottom">');
        expect(view.$el.html()).toContain('<span>reason</span>');
      });
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(view._errors).toEqual({});
      expect(view._userModel).toEqual(userModel);
      expect(view._renderModel).toEqual(model);
    });
  });

  describe('._getField', function () {
    it('should get field', function () {
      expect(view._getField('username')).toBe(USERNAME);
    });
  });

  describe('._getUserFields', function () {
    it('should get user fields', function () {
      expect(view._getUserFields()).toEqual({
        username: USERNAME
      });
    });
  });

  describe('._getDestinationValues', function () {
    it('should get destination values', function () {
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
      view.render();
      var event = $.Event('click');

      spyOn(view, 'killEvent');
      spyOn(view._userModel, 'save');

      view._onClickSave(event);

      expect(view.killEvent).toHaveBeenCalledWith(event);
    });

    it('shows a password confirmation modal when needs_password_confirmation is true', function () {
      view.render();
      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();
    });

    it('bypasses the password confirmation when needs_password_confirmation is false', function () {
      PasswordValidatedForm.showPasswordModal.calls.reset();
      userModel.set('needs_password_confirmation', false);
      view.render();

      view._onClickSave();

      expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
    });
  });

  describe('._onToggleMfa', function () {
    it('should change the multifactor authentication checkbox label', function () {
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
      view.render();

      expect(view._username()).toBe(USERNAME);
    });
  });

  describe('._newPassword', function () {
    it('should return user new password', function () {
      view.render();

      var NEW_PASSWORD = '123456';
      view.$('#user_new_password').val(NEW_PASSWORD);

      expect(view._newPassword()).toBe(NEW_PASSWORD);
    });
  });

  describe('._confirmPassword', function () {
    it('should return user confirm password', function () {
      view.render();

      var CONFIRM_PASSWORD = '123456';
      view.$('#confirm_password').val(CONFIRM_PASSWORD);

      expect(view._confirmPassword()).toBe(CONFIRM_PASSWORD);
    });
  });

  it('should not have leaks', function () {
    view.render();

    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
