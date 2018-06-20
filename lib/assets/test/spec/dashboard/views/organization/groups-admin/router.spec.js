const Router = require('dashboard/common/router-organization-groups');
const UserModel = require('dashboard/data/user-model');
const OrganizationGroupsCollection = require('dashboard/data/organization-groups-collection');
const OrganizationModel = require('dashboard/data/organization-model');
const FlashMessageModel = require('dashboard/data/flash-message-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/common/router-organization-groups', function () {
  beforeEach(function () {
    const organization = new OrganizationModel({
      owner: {
        id: 123
      }
    }, { configModel });

    const userModel = new UserModel({
      id: 123,
      base_url: 'https://carto.com/user/paco',
      username: 'paco',
      org_admin: true
    });
    userModel.setOrganization(organization);

    this.groups = new OrganizationGroupsCollection([], {
      organization: userModel.organization,
      configModel
    });

    this.flashMessageModel = new FlashMessageModel();

    this.router = new Router({
      userModel,
      flashMessageModel: this.flashMessageModel,
      rootUrl: userModel.viewUrl().organization().groups(),
      groups: this.groups,
      modals: new ModalsServiceModel()
    });
  });

  describe('.normalizeFragmentOrUrl', function () {
    it('should return the normalized pathname for URLs matching current scope', function () {
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/organization/groups/new')).toEqual('/new');
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/organization/groups/edit/123')).toEqual('/edit/123');
    });

    it('should return full URL for non-matching URLs', function () {
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/somewhere/else')).toEqual('https://carto.com/user/paco/somewhere/else');
    });
  });

  it('should render a generic loading view for starters', function () {
    var view = this.router.model.get('view');
    view.render();
    expect(this.innerHTML(view)).toContain('Loading view');
  });
});
