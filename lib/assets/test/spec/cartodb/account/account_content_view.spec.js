var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var FlashMessageModel = require('../../../../javascripts/cartodb/organization/flash_message_model');
var AccountContentView = require('../../../../javascripts/cartodb/account/account_content_view');

describe('account/account_content_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    this.flashMessageModel = new FlashMessageModel();

    this.view = new AccountContentView({
      user: this.user,
      flashMessageModel: this.flashMessageModel
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_initViews');

      this.view.render();

      expect(this.view.$el.html()).toContain('<div class="SideMenu CDB-Text CDB-Size-medium js-SideMenu"></div>');
      expect(this.view.$el.html()).toContain('<div class="js-AccountContent"></div>');
      expect(this.view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view._userModel).toBe(this.user);
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
        loadingText: 'wadus',
        errors: []
      });
    });
  });

  describe('._setFlashMessage', function () {
    it('should unset loading and show flash message', function () {
      spyOn(this.flashMessageModel, 'show');
      spyOn(this.view, '_setLoading');

      this.view._setFlashMessage({}, 'wadus', 'success');

      expect(this.view._setLoading).toHaveBeenCalledWith('');
      expect(this.flashMessageModel.show).toHaveBeenCalledWith('wadus', 'success');
    });

    describe('has errors', function () {
      it('should unset loading and show flash message', function () {
        spyOn(this.flashMessageModel, 'show');
        spyOn(this.view, '_setLoading');

        var errors = ['error1', 'error2'];
        var message = 'error message';
        var res = {
          responseJSON: {
            errors: errors,
            message: message
          }
        };

        this.view._setFlashMessage(res, 'wadus', 'error');

        expect(this.view.model.get('errors')).toEqual(errors);
        expect(this.view._setLoading).toHaveBeenCalledWith('');
        expect(this.flashMessageModel.show).toHaveBeenCalledWith(message, 'error');
      });
    });
  });

  describe('._showSuccess', function () {
    it('should set flash message', function () {
      spyOn(this.view, '_setFlashMessage');

      var data = {user_data: {}};

      this.view._showSuccess(data);

      expect(this.view._setFlashMessage).toHaveBeenCalledWith(data, 'account.flash_messages.save_changes.success', 'success');
    });
  });

  describe('._showErrors', function () {
    it('should set flash message', function () {
      spyOn(this.view, '_setFlashMessage');

      var data = {};
      this.view._showErrors(data);

      expect(this.view._setFlashMessage).toHaveBeenCalledWith(data, 'account.flash_messages.save_changes.error', 'error');
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
