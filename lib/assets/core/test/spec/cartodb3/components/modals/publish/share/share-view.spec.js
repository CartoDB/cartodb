var Backbone = require('backbone');
var ShareView = require('../../../../../../../javascripts/cartodb3/components/modals/publish/share/share-view');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/vis-definition-model');
var OrganizationModel = require('../../../../../../../javascripts/cartodb3/data/organization-model');

describe('components/modals/publish/share/share-view', function () {
  var view;
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

    view = new ShareView({
      modalModel: new Backbone.Model(),
      onBack: onBack,
      currentUserId: 'u1',
      visDefinitionModel: visDefinitionModel,
      organization: org,
      configModel: configModel
    });

    view.render();
  });

  afterEach(function () {
    view.remove();
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(view.$('.js-filters').length).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
