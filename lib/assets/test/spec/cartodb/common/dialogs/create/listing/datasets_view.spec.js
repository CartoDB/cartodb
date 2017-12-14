var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var DatasetsView = require('../../../../../../../javascripts/cartodb/common/dialogs/create/listing/datasets_view');
var CreateMapModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var VisFetchModel = require('../../../../../../../javascripts/cartodb/common/visualizations_fetch_model');

describe('common/dialogs/create/listing/datasets_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      id: 1,
      api_key: 'hello-apikey'
    });

    spyOn(this.user, 'canCreateDatasets').and.returnValue(true);

    this.createModel = new CreateMapModel({
      collectionFetched: true
    }, {
      user: this.user
    });

    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      datasetsTabDisabled: true
    });

    this.collection = new cdb.admin.Visualizations();
    spyOn(this.collection, 'fetch');

    this.view = new DatasetsView({
      defaultUrl: 'datasets',
      user: this.user,
      createModel: this.createModel,
      routerModel: this.visFetchModel,
      collection: this.collection
    });

    this.view.render();
  });

  describe('datasetsTabDisabled', function () {
    beforeEach(function () {
      spyOn(this.collection, 'size');
    });

    it('datasets tab disabled for empty collection', function () {
      this.collection.size.and.returnValue(0);
      this.collection.trigger('reset');

      expect(this.view.createModel.get('datasetsTabDisabled')).toBe(true);
      expect(this.view.routerModel.get('datasetsTabDisabled')).toBe(true);
    });

    it('datasets tab enabled for datsets collection', function() {
      this.collection.size.and.returnValue(2);
      this.collection.trigger('reset');

      expect(this.view.routerModel.get('datasetsTabDisabled')).toBe(false);
      expect(this.view.createModel.get('datasetsTabDisabled')).toBe(false);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});