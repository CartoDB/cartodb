const Backbone = require('backbone');
const ApiKeysPageView = require('dashboard/views/api-keys/api-keys-page-view');
const apiKeysCollectionTypes = require('dashboard/data/api-keys-collection-types');

describe('dashboard/views/api-keys/api-keys-page-view', function () {
  let view, userModel, renderSpy, stackLayoutModel, renderListSpy;

  const createViewFn = function (options) {
    userModel = new Backbone.Model({
      base_url: 'wadus.com'
    });
    userModel.showGoogleApiKeys = () => false;
    userModel.isInsideOrg = () => true;
    userModel.isOrgOwner = () => true;
    userModel.getOrgName = () => 'wadusORG';
    userModel.getGoogleApiKey = () => 'google-api-key';
    userModel.getAuthToken = () => 'authtoken';

    stackLayoutModel = {
      goToStep: jasmine.createSpy('goToStep')
    };

    const viewOptions = Object.assign({}, {
      stackLayoutModel,
      userModel
    }, options);

    return new ApiKeysPageView(viewOptions);
  };

  beforeEach(function () {
    renderSpy = spyOn(ApiKeysPageView.prototype, 'render');
    renderListSpy = spyOn(ApiKeysPageView.prototype, '_renderList');
    view = createViewFn();
  });

  it('throws an error when stackLayoutModel is missing', function () {
    view = function () {
      return new ApiKeysPageView({
        userModel
      });
    };

    expect(view).toThrowError('stackLayoutModel is required');
  });

  it('throws an error when userModel is missing', function () {
    view = function () {
      return new ApiKeysPageView({
        stackLayoutModel: new Backbone.Model()
      });
    };

    expect(view).toThrowError('userModel is required');
  });

  describe('.render', function () {
    beforeEach(function () {
      renderSpy.and.callThrough();
    });

    it('should call _renderList with the correct params', function () {
      view.render();
      expect(view._renderList).toHaveBeenCalledTimes(2);
      expect(view._renderList).toHaveBeenCalledWith([apiKeysCollectionTypes.MASTER, apiKeysCollectionTypes.DEFAULT], 'Default API Keys', false);
      expect(view._renderList).toHaveBeenCalledWith([apiKeysCollectionTypes.REGULAR], 'Custom API Keys', true);
    });

    it('should add 2 ApiKeyLists to the page', function () {
      renderSpy.and.callThrough();
      renderListSpy.and.callThrough();
      view.render();
      expect(view.$('.js-api-keys-list').length).toBe(2);
    });
  });
});
