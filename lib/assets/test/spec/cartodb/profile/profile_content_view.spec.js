var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ProfileContentView = require('../../../../javascripts/cartodb/profile/profile_content_view');
var FlashMessageModel = require('../../../../javascripts/cartodb/organization/flash_message_model');

var CONFIG = {
  avatar_valid_extensions: ['jpeg', 'jpg', 'gif', 'png']
};

describe('profile/profile_content_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    this.flashMessageModel = new FlashMessageModel();

    this.view = new ProfileContentView({
      user: this.user,
      config: CONFIG,
      flashMessageModel: this.flashMessageModel
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_initViews');

      this.view.render();

      expect(this.view.$el.html()).toContain('<div class="SideMenu CDB-Text CDB-Size-medium js-SideMenu"></div>');
      expect(this.view.$el.html()).toContain('<div class="js-ProfileContent"></div>');
      expect(this.view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      this.view.render();

      expect(this.view.user).toBe(this.user);
      expect(this.view.config).toBe(CONFIG);
      expect(this.view.model).toBeDefined();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(2);
    });
  });

  describe('._setLoading', function () {
    it('should hide flash message and set loading', function () {
      spyOn(this.flashMessageModel, 'hide');

      expect(this.view.model.get('isLoading')).toBeUndefined();
      expect(this.view.model.get('loadingText')).toBeUndefined();

      this.view._setLoading('wadus');

      expect(this.flashMessageModel.hide).toHaveBeenCalled();
      expect(this.view.model.attributes).toEqual({
        isLoading: true,
        loadingText: 'wadus'
      });
    });
  });

  describe('._setFlashMessage', function () {
    it('should unset loading and show flash message', function () {
      spyOn(this.flashMessageModel, 'show');
      spyOn(this.view, '_setLoading');

      var res = {};

      this.view._setFlashMessage(res, 'wadus', 'success');

      expect(this.view._setLoading).toHaveBeenCalledWith('');
      expect(this.flashMessageModel.show).toHaveBeenCalledWith('wadus', 'success');
    });

    describe('has errors', function () {
      it('should unset loading and show flash message', function () {
        spyOn(this.flashMessageModel, 'show');
        spyOn(this.view, '_setLoading');

        var res = {
          responseText: JSON.stringify({
            errors: ['error1', 'error2']
          })
        };

        this.view._setFlashMessage(res, 'wadus', 'error');

        expect(this.view._setLoading).toHaveBeenCalledWith('');
        expect(this.flashMessageModel.show).toHaveBeenCalledWith('error1. error2', 'error');
      });
    });
  });

  describe('._showSuccess', function () {
    it('should set flash message', function () {
      spyOn(this.view, '_setFlashMessage');

      var response = {};
      this.view._showSuccess('', response, {});

      expect(this.view._setFlashMessage).toHaveBeenCalledWith(response, 'Your changes have been saved correctly.', 'success');
    });
  });

  describe('._showErrors', function () {
    it('should set flash message', function () {
      spyOn(this.view, '_setFlashMessage');

      var response = { responseText: '' };
      this.view._showErrors('', response, {});

      expect(this.view._setFlashMessage).toHaveBeenCalledWith(response, 'Could not save profile, please try again.', 'error');
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
