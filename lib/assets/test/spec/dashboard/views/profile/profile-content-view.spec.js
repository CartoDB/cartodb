const _ = require('underscore');
const Backbone = require('backbone');
const ProfileContentView = require('dashboard/views/profile/profile-content/profile-content-view');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const UserModel = require('dashboard/data/user-model');

describe('dashboard/views/profile/profile-content/profile-content-view', function () {
  let userModel, configModel, flashMessageModel, view;

  const createViewFn = function (options) {
    userModel = new UserModel(
      _.extend({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'FREE'
      }, options)
    );

    flashMessageModel = new FlashMessageModel();

    configModel = new Backbone.Model({
      avatar_valid_extensions: ['jpeg', 'jpg', 'gif', 'png']
    });
    configModel.prefixUrl = () => '/public/assets/';

    const view = new ProfileContentView({
      userModel,
      configModel,
      modals: new ModalsServiceModel(),
      flashMessageModel: flashMessageModel
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
      expect(view.$el.html()).toContain('<div class="js-ProfileContent"></div>');
      expect(view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      view.render();

      expect(view._userModel).toBe(userModel);
      expect(view._configModel).toBe(configModel);
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
        loadingText: 'wadus'
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
          responseText: JSON.stringify({
            errors: errors,
            message: message
          })
        };

        view._setFlashMessage(res, message, 'error');

        expect(view._setLoading).toHaveBeenCalledWith('');
        expect(flashMessageModel.show).toHaveBeenCalledWith(message, 'error');
      });
    });
  });

  describe('._showSuccess', function () {
    it('should set flash message', function () {
      spyOn(view, '_setFlashMessage');

      const response = {};
      view._showSuccess(null, response);

      expect(view._setFlashMessage).toHaveBeenCalledWith(response, 'Your changes have been saved correctly.', 'success');
    });
  });

  describe('._showErrors', function () {
    it('should set flash message', function () {
      spyOn(view, '_setFlashMessage');

      const response = {};
      view._showErrors(null, response);

      expect(view._setFlashMessage).toHaveBeenCalledWith(response, 'Could not save profile, please try again.', 'error');
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
