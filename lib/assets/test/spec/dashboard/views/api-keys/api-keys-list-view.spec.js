const _ = require('underscore');
const Backbone = require('backbone');
const ApiKeysListView = require('dashboard/views/api-keys/api-keys-list-view');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');

const addKeys = function (collection) {
  collection.add({ type: 'master' });
  collection.add({ type: 'default' });
  collection.add({ type: 'regular' });
};

describe('dashboard/views/api-keys/api-keys-list-view', function () {
  let view, userModel, apiKeysCollection, initBindsSpy, renderSpy, stackLayoutModel;

  const createViewFn = function (options) {
    userModel = new Backbone.Model({
      base_url: 'wadus.com'
    });
    userModel.showGoogleApiKeys = () => true;
    userModel.isInsideOrg = () => true;
    userModel.isOrgOwner = () => true;
    userModel.getOrgName = () => 'wadusORG';
    userModel.getGoogleApiKey = () => 'google-api-key';

    apiKeysCollection = new ApiKeysCollection([], { userModel });
    spyOn(apiKeysCollection, 'fetch');

    stackLayoutModel = {
      goToStep: jasmine.createSpy('goToStep')
    };

    const viewOptions = Object.assign({}, {
      apiKeysCollection,
      stackLayoutModel,
      userModel
    }, options);

    return new ApiKeysListView(viewOptions);
  };

  beforeEach(function () {
    initBindsSpy = spyOn(ApiKeysListView.prototype, '_initBinds');
    renderSpy = spyOn(ApiKeysListView.prototype, 'render');
    view = createViewFn();
  });

  it('throws an error when apiKeysCollection is missing', function () {
    view = function () {
      return new ApiKeysListView({});
    };

    expect(view).toThrowError('apiKeysCollection is required');
  });

  it('throws an error when stackLayoutModel is missing', function () {
    view = function () {
      return new ApiKeysListView({
        apiKeysCollection: new ApiKeysCollection([], { userModel })
      });
    };

    expect(view).toThrowError('stackLayoutModel is required');
  });

  it('throws an error when userModel is missing', function () {
    view = function () {
      return new ApiKeysListView({
        apiKeysCollection: new ApiKeysCollection([], { userModel }),
        stackLayoutModel: new Backbone.Model()
      });
    };

    expect(view).toThrowError('userModel is required');
  });

  describe('._initialize', function () {
    it('should call ._initBinds() and apiKeysCollection.fetch()', function () {
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
      collectionItem = apiKeysCollection.add({
        name: 'fake_name'
      });

      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is changed in ApiKeysCollection', function () {
      collectionItem = apiKeysCollection.add({
        name: 'fake_name'
      });
      view.render.calls.reset();

      collectionItem.set(name, 'another_fake_name');
      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is removed in ApiKeysCollection', function () {
      collectionItem = apiKeysCollection.add({
        name: 'fake_name'
      });
      view.render.calls.reset();

      collectionItem.destroy();
      expect(view.render).toHaveBeenCalled();
    });

    it('should call render() when an existing element is removed in ApiKeysCollection', function () {
      apiKeysCollection.trigger('sync');
      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('._render', function () {
    beforeEach(function () {
      renderSpy.and.callThrough();
    });

    it('should render loading if apiKeysCollection is not fetched', function () {
      apiKeysCollection.status = 'unfetched';
      spyOn(view, '_renderLoading');

      view.render();

      expect(view._renderLoading).toHaveBeenCalled();
    });

    it('should render keys if apiKeysCollection is fetched', function () {
      apiKeysCollection.status = 'fetched';
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
      addKeys(apiKeysCollection);
      apiKeysCollection.status = 'fetched';

      view.render();

      expect(view.$('.js-api-keys-list > li').length).toBe(3);
      expect(_.size(view._subviews)).toBe(4); // [3xApiKey, Pagination]
    });
  });

  describe('when showGoogleApiKeys is true', function () {
    beforeEach(function () {
      renderSpy.and.callThrough();
    });

    describe('._render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.el.innerHTML).toContain('Google Maps');
      });
    });
  });

  describe('when showGoogleApiKeys is false', function () {
    beforeEach(function () {
      userModel.showGoogleApiKeys = () => false;
      renderSpy.and.callThrough();
    });

    describe('._render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.el.innerHTML).not.toContain('Google Maps');
      });
    });
  });

  describe('._onAddClick', function () {
    it('should go to step 1 when clicked', function () {
      renderSpy.and.callThrough();
      view.render();

      const addButton = view.$('.js-add');
      addButton.click();

      expect(stackLayoutModel.goToStep).toHaveBeenCalledWith(1);
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
