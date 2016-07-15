var Backbone = require('backbone');
var ShareOrgView = require('../../../../../../javascripts/cartodb3/components/modals/share-organization/share-org-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var OrganizationModel = require('../../../../../../javascripts/cartodb3/data/organization-model');

describe('components/modals/share-organization/share-org-view', function () {
  var view;
  var onBack;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
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

    spyOn(ShareOrgView.prototype, '_onCancel');
    spyOn(ShareOrgView.prototype, '_onSave');
    onBack = jasmine.createSpy('onBack');

    view = new ShareOrgView({
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
  });

  it('should render properly', function () {
    expect(view.$el.html()).toContain('Foo Map');
    expect(view.$('button.js-back').length).toBe(1);
    expect(view.$('button.js-save').length).toBe(1);
    expect(view.$('button.js-cancel').length).toBe(1);
  });

  it('should bind properly', function () {
    view.$('button.js-back').trigger('click');
    expect(onBack).toHaveBeenCalled();

    view.$('button.js-save').trigger('click');
    expect(ShareOrgView.prototype._onSave).toHaveBeenCalled();

    view.$('button.js-cancel').trigger('click');
    expect(ShareOrgView.prototype._onCancel).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
