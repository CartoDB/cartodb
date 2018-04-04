var Backbone = require('backbone');
var GuessingTogglerView = require('builder/components/modals/add-layer/footer/guessing-toggler-view');
var CreateModel = require('builder/components/modals/add-layer/add-layer-model');
var getUserModelFixture = require('fixtures/builder/user-model.fixture.js');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

describe('components/modals/add-layer/footer/guessing-toggler-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/viz\?.*'))
      .andReturn({ status: 200 });

    this.upgradeUrl = window.upgrade_url;
    window.upgrade_url = 'paco_upgrade';

    this.userModel = getUserModelFixture();

    this.createModel = new CreateModel({
      type: 'map',
      contentPane: 'listing',
      listing: 'import'
    }, {
      configModel: getConfigModelFixture(),
      userModel: this.userModel,
      userActions: {},
      pollingModel: new Backbone.Model()
    });

    this.guessingModel = new Backbone.Model({ guessing: true });
    this.view = new GuessingTogglerView({
      userModel: this.userModel,
      guessingModel: this.guessingModel,
      createModel: this.createModel,
      configModel: jasmine.createSpyObj('configModel', ['get'])
    });

    spyOn(this.createModel, 'bind').and.callThrough();
    this.spyOnHasOwnTwitterCredentials = spyOn(this.userModel, 'hasOwnTwitterCredentials');

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.guessing-desc');
    expect(this.view.$('.js-toggle').length).toBe(1);
    expect(this.view.$('.js-toggle input').is(':checked')).toBeTruthy();
  });

  describe('when twitter import is active', function () {
    beforeEach(function () {
      this.createModel.set('activeImportPane', 'twitter');
    });

    it('should not render guessing button', function () {
      expect(this.view.$el.text()).not.toContain('components.modals.add-layer.footer.guessing-desc');
      expect(this.view.$('button').length).toBe(0);
    });

    it('should display how to get historical data when user has his own credentials', function () {
      this.spyOnHasOwnTwitterCredentials.and.returnValue(true);
      this.view.render();
      expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.twitter-how-to-historical');
      expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.contact-team');
    });

    it('should display a deprecated warning if user does not have his own credentials', function () {
      this.spyOnHasOwnTwitterCredentials.and.returnValue(false);
      this.view.render();
      expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.deprecated-connector');
      expect(this.view.$el.text()).toContain('components.modals.add-layer.footer.twitter-contact-support');
    });
  });

  it('should not change type and content guessing attributes when button is clicked', function () {
    // Valid "upload"
    var uploadModel = this.createModel.getUploadModel();
    uploadModel.setUpload({
      type: 'url',
      value: 'https://carto.com'
    });
    expect(uploadModel.get('content_guessing')).toBeTruthy();
    expect(uploadModel.get('type_guessing')).toBeTruthy();
    expect(this.guessingModel.get('guessing')).toBeTruthy();
    this.view.$('.js-toggle').click();
    expect(this.guessingModel.get('guessing')).toBeFalsy();
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
    expect(this.guessingModel.get('guessing')).toBeFalsy();
    expect(uploadModel.get('content_guessing')).toBeTruthy();
    expect(uploadModel.get('type_guessing')).toBeTruthy();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
