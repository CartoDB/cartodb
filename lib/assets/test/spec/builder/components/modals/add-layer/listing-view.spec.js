var _ = require('underscore');
var Backbone = require('backbone');
var ListingView = require('builder/components/modals/add-layer/content/listing-view');
var CreateModel = require('builder/components/modals/add-layer/add-layer-model');
var UserModel = require('builder/data/user-model');

describe('components/modals/add-layer/listing-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/viz\?.*'))
      .andReturn({ status: 200 });

    var configModel = jasmine.createSpyObj('configModel', ['get', 'urlVersion']);
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    this.createModel = new CreateModel({
      type: 'map',
      contentPane: 'listing',
      listing: 'import'
    }, {
      configModel: configModel,
      userModel: this.userModel,
      userActions: {},
      pollingModel: new Backbone.Model()
    });

    this.view = new ListingView({
      userModel: this.userModel,
      createModel: this.createModel,
      configModel: configModel,
      privacyModel: new Backbone.Model({
        privacy: 'PRIVATE'
      }),
      guessingModel: new Backbone.Model({
        guessing: true
      })
    });

    spyOn(this.createModel._tablesCollection, 'fetch');
    spyOn(this.createModel, 'bind').and.callThrough();
    spyOn(this.createModel._visualizationFetchModel, 'bind').and.callThrough();

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render correctly', function () {
    this.createModel.set('option', 'listing');
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
