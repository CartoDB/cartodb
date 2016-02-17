var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AddWidgetsView = require('../../../../../javascripts/cartodb3/editor/add-widgets/add-widgets-view');

describe('editor/add-widgets/add-widgets-view', function () {
  var FETCHING_TITLE = 'fetching-tables';

  beforeEach(function () {
    var configModel = new ConfigModel();
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      {
        id: 'l-0'
      }, {
        id: 'l-1',
        options: {
          table_name: 'table_name1'
        }
      }, {
        id: 'l-2',
        options: {
          table_name: 'table_name2'
        }
      }
    ], {
      configModel: configModel,
      layersCollection: new Backbone.Collection(),
      mapId: 123
    });
    this.t1 = this.layerDefinitionsCollection.at(1).tableModel;
    this.t2 = this.layerDefinitionsCollection.at(2).tableModel;
    spyOn(this.t1, 'fetch');
    spyOn(this.t2, 'fetch');
    this.t2.set('fetched', true);

    this.modalmodel = new cdb.core.Model();
    this.view = new AddWidgetsView({
      modalModel: this.modalmodel,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should fetch unfetched tables', function () {
    expect(this.t1.fetch).toHaveBeenCalled();
    expect(this.t2.fetch).not.toHaveBeenCalled();
  });

  it('should show loading msg', function () {
    expect(this.view.$('.js-body').html()).toContain(FETCHING_TITLE);
  });

  describe('when all tables are fetched', function () {
    beforeEach(function () {
      this.t1.set('fetched', true);
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(FETCHING_TITLE);
    });
  });
});
