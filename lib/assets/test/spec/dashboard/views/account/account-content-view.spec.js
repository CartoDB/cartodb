const _ = require('underscore');
const CartoNode = require('carto-node');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const AccountContentView = require('dashboard/views/account/account-content-view');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/account/account-content-view', function () {
  const client = new CartoNode.AuthenticatedClient();
  let userModel, view, flashMessageModel;

  const createViewFn = function () {
    userModel = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    flashMessageModel = new FlashMessageModel();

    const view = new AccountContentView({
      userModel,
      configModel: ConfigModelFixture,
      flashMessageModel,
      client
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(view, '_initViews');

      view.render();

      expect(view.$el.html()).toContain('<div class="SideMenu CDB-Text CDB-Size-medium js-SideMenu"></div>');
      expect(view.$el.html()).toContain('<div class="js-AccountContent"></div>');
      expect(view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(view._userModel).toBe(userModel);
      expect(view.model).toBeDefined();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      view.render();

      expect(_.size(view._subviews)).toBe(2);
    });
  });

  describe('._setLoading', function () {
    it('should hide flash message and set loading', function () {
      spyOn(flashMessageModel, 'hide');

      expect(view.model.get('isLoading')).toBeUndefined();
      expect(view.model.get('loadingText')).toBeUndefined();

      view._setLoading('wadus');

      expect(flashMessageModel.hide).toHaveBeenCalled();
      expect(view.model.attributes).toEqual({
        isLoading: true,
        loadingText: 'wadus',
        errors: []
      });
    });
  });

  describe('._setFlashMessage', function () {
    it('should unset loading and show flash message', function () {
      spyOn(flashMessageModel, 'show');
      spyOn(view, '_setLoading');

      view._setFlashMessage({}, 'wadus', 'success');

      expect(view._setLoading).toHaveBeenCalledWith('');
      expect(flashMessageModel.show).toHaveBeenCalledWith('wadus', 'success');
    });

    describe('has errors', function () {
      it('should unset loading and show flash message', function () {
        spyOn(flashMessageModel, 'show');
        spyOn(view, '_setLoading');

        const errors = ['error1', 'error2'];
        const message = 'error message';
        const res = {
          responseJSON: {
            errors: errors,
            message: message
          }
        };

        view._setFlashMessage(res, 'wadus', 'error');

        expect(view.model.get('errors')).toEqual(errors);
        expect(view._setLoading).toHaveBeenCalledWith('');
        expect(flashMessageModel.show).toHaveBeenCalledWith(message, 'error');
      });
    });
  });

  describe('._showSuccess', function () {
    it('should set flash message', function () {
      spyOn(view, '_setFlashMessage');

      const data = {user_data: {}};

      view._showSuccess(data);

      expect(view._setFlashMessage).toHaveBeenCalledWith(data, 'account.flash_messages.save_changes.success', 'success');
    });

    it('redirects to multifactor_authentication when mfa_required is true', function () {
      spyOn(view, '_goToMultifactorAuthentication');
      const data = { user_data: {}, mfa_required: true };

      view._showSuccess(data);

      expect(view._goToMultifactorAuthentication).toHaveBeenCalled();
    });

    it('does not redirect when mfa_required is false', function () {
      spyOn(view, '_goToMultifactorAuthentication');
      const data = { user_data: {}, mfa_required: false };

      view._showSuccess(data);

      expect(view._goToMultifactorAuthentication).not.toHaveBeenCalled();
    });
  });

  describe('._showErrors', function () {
    it('should set flash message', function () {
      spyOn(view, '_setFlashMessage');

      const data = {};
      view._showErrors(data);

      expect(view._setFlashMessage).toHaveBeenCalledWith(data, 'account.flash_messages.save_changes.error', 'error');
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
