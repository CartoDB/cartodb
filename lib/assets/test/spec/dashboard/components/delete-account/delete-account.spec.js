const $ = require('jquery');
const Backbone = require('backbone');
const CartoNode = require('carto-node');
const UserModel = require('dashboard/data/user-model');
const DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');
const client = new CartoNode.AuthenticatedClient();

describe('dashboard/components/delete-account/delete-account-view', function () {
  let user, deleteAccountView, onErrorsSpy;

  beforeEach(function () {
    jasmine.Ajax.install();

    user = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    onErrorsSpy = jasmine.createSpy('onError');

    deleteAccountView = new DeleteAccountView({
      userModel: user,
      onError: onErrorsSpy,
      modalModel: new Backbone.Model(),
      client
    });
  });

  afterEach(function () {
    deleteAccountView.clean();
    jasmine.Ajax.uninstall();
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(deleteAccountView._userModel).toBe(user);
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(deleteAccountView.$('.js-form')).toBeDefined();
    });

    describe('needs password confirmation', function () {
      beforeEach(function () {
        user.set('needs_password_confirmation', true);
      });

      it('should render properly', function () {
        const content = deleteAccountView.render().el;

        expect(content.innerHTML).toContain('In any case, you need to type your password.');
        expect(content.innerHTML).toContain('<input type="password" id="deletion_password_confirmation" name="deletion_password_confirmation" class="CDB-InputText CDB-Text Form-input Form-input--long" value="">');
      });
    });
  });

  describe('._onClickDelete', function () {
    beforeEach(function () {
      deleteAccountView.render();
    });

    describe('success', function () {
      it('should should delete account', function () {
        const successResponse = {
          message: 'Success'
        };

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({
            status: 200,
            contentType: 'application/json; charset=utf-8',
            responseText: JSON.stringify(successResponse)
          });

        spyOn(deleteAccountView, '_onSuccess');
        const event = $.Event('click');

        spyOn(deleteAccountView, 'killEvent');

        deleteAccountView._onClickDelete(event);

        expect(deleteAccountView.killEvent).toHaveBeenCalledWith(event);
        expect(deleteAccountView._onSuccess).toHaveBeenCalledWith(successResponse);
      });
    });

    describe('error', function () {
      it('should fail', function () {
        const errorResponse = {
          message: 'Error'
        };

        jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
          .andReturn({
            status: 400,
            contentType: 'application/json; charset=utf-8',
            responseText: JSON.stringify(errorResponse)
          });

        const event = $.Event('click');

        spyOn(deleteAccountView, 'killEvent');

        deleteAccountView._onError({}, errorResponse);
        deleteAccountView._onClickDelete(event);

        expect(deleteAccountView.killEvent).toHaveBeenCalledWith(event);
        expect(deleteAccountView._onError).toHaveBeenCalledWith({}, errorResponse);
      });
    });
  });

  describe('._onError', function () {
    const errorResponse = {
      message: 'Error'
    };

    jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
      .andReturn({
        status: 400,
        contentType: 'application/json; charset=utf-8',
        responseText: JSON.stringify(errorResponse)
      });

    it('should throw error and close', function () {
      spyOn(deleteAccountView, '_closeDialog');

      deleteAccountView._onFormError({}, errorResponse);

      expect(onErrorsSpy).toHaveBeenCalledWith({}, errorResponse);
      expect(deleteAccountView._closeDialog).toHaveBeenCalled();
    });
  });

  describe('._onSuccess', function () {
    it('should set href and close', function () {
      const successResponse = {
        message: 'Success',
        logout_url: '/logout'
      };

      jasmine.Ajax.stubRequest(new RegExp(/api\/v3\/me/))
        .andReturn({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          responseText: JSON.stringify(successResponse)
        });

      const logout_url = '/logout';

      spyOn(deleteAccountView, '_setHref');
      spyOn(deleteAccountView, '_closeDialog');

      deleteAccountView._onSuccess({ logout_url: logout_url }, 'success', jasmine.any(Object));

      expect(deleteAccountView._setHref).toHaveBeenCalledWith(logout_url);
      expect(deleteAccountView._closeDialog).toHaveBeenCalled();
    });
  });
});
