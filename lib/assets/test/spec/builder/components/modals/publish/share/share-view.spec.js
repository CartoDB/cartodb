var Backbone = require('backbone');
var ShareView = require('builder/components/modals/publish/share/share-view');
var ConfigModel = require('builder/data/config-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var OrganizationModel = require('builder/data/organization-model');

describe('components/modals/publish/share/share-view', function () {
  var onBack;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?://.*/grantables.*'))
      .andReturn({ status: 200 });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var org = new OrganizationModel({
      id: 'org1',
      owner: {
        id: 'hello',
        username: 'dev',
        email: 'hello@hello'
      }
    }, {
      configModel: configModel
    });

    spyOn(ShareView.prototype, '_onCancel');
    spyOn(ShareView.prototype, '_onSave');
    onBack = jasmine.createSpy('onBack');

    this.view = new ShareView({
      modalModel: new Backbone.Model(),
      onBack: onBack,
      currentUserId: 'u1',
      visDefinitionModel: visDefinitionModel,
      organization: org,
      configModel: configModel
    });

    this.view.render();
  });

  afterEach(function () {
    this.view.remove();
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-filters').length).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
