const _ = require('underscore');
const Backbone = require('backbone');
const ApiKeysListView = require('dashboard/views/api-keys/api-keys-list-view');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');
const apiKeysCollectionTypes = require('dashboard/data/api-keys-collection-types');

const addKeys = function (collection) {
  collection.add({ type: 'master' });
  collection.add({ type: 'default' });
  collection.add({ type: 'regular' });
};

describe('dashboard/views/api-keys/api-keys-list-view', function () {
  let view, userModel, initBindsSpy, renderSpy, stackLayoutModel,
    apiKeysType, title, showNewApiKeyButton, configModel, disabled;

  const createViewFn = function (options) {
    userModel = new Backbone.Model({
      base_url: 'wadus.com'
    });
    userModel.showGoogleApiKeys = () => true;
    userModel.isInsideOrg = () => true;
    userModel.isOrgOwner = () => true;
    userModel.getOrgName = () => 'wadusORG';
    userModel.getGoogleApiKey = () => 'google-api-key';
    userModel.getAuthToken = () => 'authtoken';

    configModel = new Backbone.Model({
      upgrade_url: '/test-upgrade-url/'
    });

    stackLayoutModel = {
      goToStep: jasmine.createSpy('goToStep')
    };

    apiKeysType = [apiKeysCollectionTypes.MASTER, apiKeysCollectionTypes.DEFAULT].join(',');
    title = 'Default API Keys';
    showNewApiKeyButton = false;
    disabled = false;

    const viewOptions = Object.assign({}, {
      stackLayoutModel,
      userModel,
      configModel,
      apiKeysType,
      title,
      showNewApiKeyButton,
      disabled
    }, options);

    return new ApiKeysListView(viewOptions);
  };

  beforeEach(function () {
    initBindsSpy = spyOn(ApiKeysListView.prototype, '_initBinds');
    renderSpy = spyOn(ApiKeysListView.prototype, 'render');
    spyOn(ApiKeysCollection.prototype, 'fetch');
    view = createViewFn();
  });

  afterEach(function () {
    initBindsSpy.calls.reset();
  });

  it('throws an error when stackLayoutModel is missing', function () {
    view = function () {
      return new ApiKeysListView({
        userModel,
        configModel,
        apiKeysType,
        title,
        showNewApiKeyButton,
        disabled
      });
    };

    expect(view).toThrowError('stackLayoutModel is required');
  });

  it('throws an error when userModel is missing', function () {
    view = function () {
      return new ApiKeysListView({
        stackLayoutModel: new Backbone.Model(),
        apiKeysType,
        configModel,
        title,
        showNewApiKeyButton,
        disabled
      });
    };

    expect(view).toThrowError('userModel is required');
  });

  it('throws an error when apiKeysType is missing', function () {
    view = function () {
      return new ApiKeysListView({
        stackLayoutModel: new Backbone.Model(),
        userModel,
        configModel,
        title,
        showNewApiKeyButton,
        disabled
      });
    };

    expect(view).toThrowError('apiKeysType is required');
  });

  it('throws an error when title is missing', function () {
    view = function () {
      return new ApiKeysListView({
        stackLayoutModel: new Backbone.Model(),
        userModel,
        configModel,
        apiKeysType,
        showNewApiKeyButton,
        disabled
      });
    };

    expect(view).toThrowError('title is required');
  });

  it('throws an error when showNewApiKeyButton is missing', function () {
    view = function () {
      return new ApiKeysListView({
        stackLayoutModel: new Backbone.Model(),
        userModel,
        configModel,
        apiKeysType,
        title,
        disabled
      });
    };

    expect(view).toThrowError('showNewApiKeyButton is required');
  });

  it('throws an error when disabled is missing', function () {
    view = function () {
      return new ApiKeysListView({
        stackLayoutModel: new Backbone.Model(),
        userModel,
        configModel,
        apiKeysType,
        title,
        showNewApiKeyButton
      });
    };

    expect(view).toThrowError('disabled is required');
  });

  describe('._initialize', function () {
    it('should call ._initBinds() and ._apiKeysCollection.fetch()', function () {
      expect(view._initBinds).toHaveBeenCalled();
      expect(view._apiKeysCollection.fetch).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    let collectionItem;

    beforeEach(function () {
      initBindsSpy.and.callThrough();
      view = createViewFn();
    });

    it('should call render() when a new element is added in ApiKeysCollection', function () {
      collectionItem = view._apiKeysCollection.add({
        name: 'fake_name'
      });

      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is changed in ApiKeysCollection', function () {
      collectionItem = view._apiKeysCollection.add({
        name: 'fake_name'
      });
      view.render.calls.reset();

      collectionItem.set(name, 'another_fake_name');
      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is removed in ApiKeysCollection', function () {
      collectionItem = view._apiKeysCollection.add({
        name: 'fake_name'
      });
      view.render.calls.reset();

      collectionItem.destroy();
      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is removed in ApiKeysCollection', function () {
      view._apiKeysCollection.trigger('sync');
      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('._render', function () {
    beforeEach(function () {
      renderSpy.and.callThrough();
    });

    it('should render loading if apiKeysCollection is not fetched', function () {
      view._apiKeysCollection.status = 'unfetched';
      spyOn(view, '_renderLoading');

      view.render();

      expect(view._renderLoading).toHaveBeenCalled();
    });

    it('should render keys if apiKeysCollection is fetched', function () {
      view._apiKeysCollection.status = 'fetched';
      spyOn(view, '_renderKeys');

      view.render();

      expect(view._renderKeys).toHaveBeenCalled();
    });

    it('should render loading status is not fetched', function () {
      view.render();

      expect(view.$('.js-api-keys-list li').length).toBe(1);
      expect(view.$('.ApiKeys-list-loader').length).toBe(1);
    });

    it('should render api keys list when status is fetched', function () {
      addKeys(view._apiKeysCollection);
      view._apiKeysCollection.status = 'fetched';

      view.render();

      expect(view.$('.js-api-keys-list > li').length).toBe(3);
      expect(_.size(view._subviews)).toBe(4); // [3xApiKey, Pagination]
    });
  });

  describe('._onAddClick', function () {
    it('should go to step 1 when clicked', function () {
      view = createViewFn({
        apiKeysType: [apiKeysCollectionTypes.REGULAR],
        title: 'Custom API Keys',
        showNewApiKeyButton: true
      });

      renderSpy.and.callThrough();
      view.render();

      const addButton = view.$('.js-add');
      addButton.click();

      expect(view._stackLayoutModel.goToStep).toHaveBeenCalledWith(1);
    });
  });

  describe('._onEdit', function () {
    it('should go to step 1 when clicked', function () {
      const model = new Backbone.Model();
      view._onEdit(model);

      expect(stackLayoutModel.goToStep).toHaveBeenCalledWith(1, model);
    });
  });
});
