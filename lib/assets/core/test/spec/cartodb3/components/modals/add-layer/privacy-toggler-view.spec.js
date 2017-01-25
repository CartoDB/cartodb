var Backbone = require('backbone');
var PrivacyTogglerView = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/footer/privacy-toggler-view');
var CreateModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');

describe('components/modals/add-layer/footer/privacy-toggler-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/viz\?.*'))
      .andReturn({ status: 200 });

    this.upgradeUrl = window.upgrade_url;
    window.upgrade_url = 'paco_upgrade';
    var configModel = jasmine.createSpyObj('configModel', ['get', 'urlVersion']);

    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    this.model = new CreateModel({
      option: 'listing',
      listing: 'import'
    }, {
      configModel: configModel,
      userModel: this.userModel,
      userActions: {},
      pollingModel: new Backbone.Model()
    });

    this.privacyModel = new Backbone.Model({ privacy: 'PUBLIC' });
    this.view = new PrivacyTogglerView({
      userModel: this.userModel,
      privacyModel: this.privacyModel,
      createModel: this.model,
      configModel: configModel
    });

    spyOn(this.model, 'bind').and.callThrough();
    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(this.view.$('.PrivacyToggler').length).toBe(1);
    expect(this.view.$('.PrivacyToggler--PUBLIC').length).toBe(1);
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeFalsy();
  });

  it('should change privacy when it is clicked', function () {
    expect(this.privacyModel.get('privacy')).toBe('PUBLIC');
    expect(this.view.$('.PrivacyToggler--PUBLIC').length).toBe(1);
    this.view.$('.PrivacyToggler').click();
    expect(this.privacyModel.get('privacy')).toBe('PRIVATE');
    expect(this.view.$('.PrivacyToggler--PRIVATE').length).toBe(1);
  });

  it('should point to upgrade when user can\'t change privacy', function () {
    var actions = { private_tables: false };
    this.userModel.set('actions', actions);
    this.view.render();
    expect(this.view.$('a.PrivacyToggler').length).toBe(1);
    expect(this.view.$('a.PrivacyToggler').attr('href')).toBe('paco_upgrade');
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeTruthy();
  });

  it('should not point to upgrade if user can\'t change privacy and there is no upgrade url', function () {
    window.upgrade_url = '';
    var actions = { private_tables: false };
    this.userModel.set('actions', actions);
    this.view.render();
    expect(this.view.$('a.PrivacyToggler').length).toBe(0);
    expect(this.view.$('button.PrivacyToggler').length).toBe(1);
    expect(this.view.$('.PrivacyToggler').hasClass('is-disabled')).toBeTruthy();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    window.upgrade_url = this.upgradeUrl;
  });
});
