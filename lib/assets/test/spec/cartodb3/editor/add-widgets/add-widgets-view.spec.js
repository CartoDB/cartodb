var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var TablesCollection = require('../../../../../javascripts/cartodb3/data/tables-collection');
var AddWidgetsView = require('../../../../../javascripts/cartodb3/editor/add-widgets/add-widgets-view');

describe('editor/add-widgets/add-widgets-view', function () {
  var FETCHING_TITLE = 'fetching-tables';

  beforeEach(function () {
    var configModel = new ConfigModel();

    this.tableModel1 = new cdb.core.Model({ fetched: false });
    spyOn(this.tableModel1, 'fetch');
    this.tableModel2 = new cdb.core.Model({ fetched: true });
    spyOn(this.tableModel2, 'fetch');
    this.tablesCollection = new TablesCollection([
      this.tableModel1,
      this.tableModel2
    ], {
      baseUrl: '/',
      configModel: configModel
    });

    this.modalmodel = new cdb.core.Model();
    this.createWidgetsOptionsCollectionSpy = jasmine.createSpy('createWidgetsOptionsCollection');
    this.view = new AddWidgetsView({
      modalModel: this.modalmodel,
      tablesCollection: this.tablesCollection,
      createWidgetsOptionsCollection: this.createWidgetsOptionsCollectionSpy
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should fetch unfetched tables', function () {
    expect(this.tableModel1.fetch).toHaveBeenCalled();
    expect(this.tableModel2.fetch).not.toHaveBeenCalled();
  });

  it('should show loading msg', function () {
    expect(this.view.$('.js-body').html()).toContain(FETCHING_TITLE);
  });

  describe('when all tables are fetched', function () {
    beforeEach(function () {
      var collection = new Backbone.Collection();
      this.createWidgetsOptionsCollectionSpy.and.returnValue(collection);
      this.tableModel1.set('fetched', true);
    });

    it('should create widgets options from tables', function () {
      expect(this.createWidgetsOptionsCollectionSpy).toHaveBeenCalled();
      expect(this.createWidgetsOptionsCollectionSpy).toHaveBeenCalledWith(this.tablesCollection);
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(FETCHING_TITLE);
    });
  });
});
