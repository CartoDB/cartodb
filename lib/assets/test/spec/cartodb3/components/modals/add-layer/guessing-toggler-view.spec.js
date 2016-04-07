var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var GuessingTogglerView = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/footer/guessing-toggler-view');
var CreateModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');

describe('components/modals/add-layer/footer/guessing-toggler-view', function () {
  beforeEach(function () {
    this.upgradeUrl = window.upgrade_url;
    window.upgrade_url = 'paco_upgrade';

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

    this.guessingModel = new cdb.core.Model({ guessing: true });
    this.view = new GuessingTogglerView({
      userModel: this.userModel,
      guessingModel: this.guessingModel,
      createModel: this.createModel,
      configModel: jasmine.createSpyObj('configModel', ['get'])
    });

    spyOn(this.createModel, 'bind').and.callThrough();
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.guessing-desc');
    expect(this.view.$('.js-toggle').length).toBe(1);
    expect(this.view.$('.js-toggle input').is(':checked')).toBeTruthy();
  });

  it("shouldn't render guessing button when twitter import is selected", function () {
    this.createModel.set('activeImportPane', 'twitter');
    expect(this.view.$el.text()).not.toContain('components.modals.add-layer.footer.guessing-desc');
    expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.twitter-desc');
    expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.contact-team');
    expect(this.view.$('button').length).toBe(0);
  });

  it('should not change type and content guessing attributes when button is clicked', function () {
    // Valid "upload"
    var uploadModel = this.createModel.getUploadModel();
    uploadModel.setUpload({
      type: 'url',
      value: 'http://cartodb.com'
    });
    expect(uploadModel.get('content_guessing')).toBeTruthy();
    expect(uploadModel.get('type_guessing')).toBeTruthy();
    expect(this.view.model.get('guessing')).toBeTruthy();
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(uploadModel.get('content_guessing')).toBeTruthy();
    expect(uploadModel.get('type_guessing')).toBeTruthy();
  });

  it('should not change type and content guessing attributes when upload isn\'t valid', function () {
    // Non valid "upload"
    var uploadModel = this.createModel.getUploadModel();
    uploadModel.setUpload({
      type: 'url',
      value: 'hello'
    });
    this.view.$('.js-toggle').click();
    expect(this.view.model.get('guessing')).toBeFalsy();
    expect(uploadModel.get('content_guessing')).toBeTruthy();
    expect(uploadModel.get('type_guessing')).toBeTruthy();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
