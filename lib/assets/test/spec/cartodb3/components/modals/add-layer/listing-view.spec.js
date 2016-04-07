var _ = require('underscore');
var Backbone = require('backbone');
var ListingView = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/content/listing-view');
var CreateModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');

describe('components/modals/add-layer/listing-view', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.createModel = new CreateModel({
      type: 'map',
      contentPane: 'listing',
      listing: 'import'
    }, {
      configModel: 'c',
      userModel: this.userModel,
      layerDefinitionsCollection: new Backbone.Collection()
    });

    this.view = new ListingView({
      userModel: this.userModel,
      createModel: this.createModel
    });

    spyOn(this.createModel._tablesCollection, 'fetch');
    spyOn(this.createModel, 'bind').and.callThrough();
    spyOn(this.createModel._visualizationFetchModel, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function () {
    this.createModel.set('option', 'listing');
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
