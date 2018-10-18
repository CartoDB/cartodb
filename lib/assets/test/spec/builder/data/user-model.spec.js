var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');

describe('data/user-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new UserModel({
      id: 'uuid',
      organization: {
        id: 'o1',
        admins: []
      },
      layers: [{
        options: {
          visible: true,
          type: 'Tiled',
          urlTemplate: 'https://a.tiles.mapbox.com/v4/username.12ab45c/{z}/{x}/{y}.png?access_token=aBcDC12323abc',
          attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
          maxZoom: 21,
          minZoom: 0,
          name: 'MapBox Streets Outdoors Global Preview',
          order: 26
        },
        kind: 'tiled',
        infowindow: null,
        tooltip: null,
        id: 'basemap-id-1',
        order: 26
      }, {
        id: 'basemap-id-2',
        infowindow: null,
        kind: 'tiled',
        options: {
          attribution: null,
          className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
          maxZoom: 21,
          minZoom: 0,
          name: 'Custom basemap 29',
          order: 29,
          tms: false,
          type: 'Tiled',
          urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
          visible: true
        },
        order: 29,
        tooltip: null
      }]
    }, {
      configModel: configModel
    });
  });

  it('should create an organization', function () {
    expect(this.model._organizationModel.id).toEqual('o1');
  });

  it('should have layers', function () {
    expect(this.model.layers.length).toEqual(2);
  });

  it("shouldn't set avatar_url is it comes with null value", function () {
    expect(this.model.get('avatar_url')).toBe('http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png');
  });

  it('isInsideOrg', function () {
    this.model._organizationModel.id = '';
    expect(this.model.isInsideOrg()).toEqual(false);
    this.model._organizationModel.id = 'hello-org-id';
    expect(this.model.isInsideOrg()).toEqual(true);
  });

  it('isOrgOwner', function () {
    this.model._organizationModel._ownerModel = this.model;
    expect(this.model.isOrgOwner()).toEqual(true);
    this.model._organizationModel._ownerModel = new UserModel({
      id: 'test',
      organization: {}
    }, { configModel: 'c' });
    expect(this.model.isOrgOwner()).toEqual(false);
  });

  it('hasOwnTwitterCredentials', function () {
    expect(this.model.hasOwnTwitterCredentials()).toEqual(false);

    var twitterConfig = {
      quota: 100,
      monthly_use: 0,
      block_size: 10,
      block_price: 1000,
      enabled: true,
      hard_limit: false,
      customized_config: true
    };
    this.model.set('twitter', twitterConfig);
    expect(this.model.hasOwnTwitterCredentials()).toEqual(true);

    twitterConfig.customized_config = false;
    this.model.set('twitter', twitterConfig);
    expect(this.model.hasOwnTwitterCredentials()).toEqual(false);
  });

  it('isOrgAdmin', function () {
    this.model._organizationModel.set('admins', [{id: this.model.id}]);
    expect(this.model.isOrgAdmin()).toEqual(true);
    this.model._organizationModel.set('admins', [{id: 'other_user'}]);
    expect(this.model.isOrgAdmin()).toEqual(false);
    this.model._organizationModel = null;
    expect(this.model.isOrgAdmin()).toEqual(false);
  });

  it('should answer if user can create new datasets', function () {
    this.model.set('remaining_byte_quota', 0);
    expect(this.model.canCreateDatasets()).toEqual(false);
    this.model.set('remaining_byte_quota', 10);
    expect(this.model.canCreateDatasets()).toEqual(true);
    this.model.set('remaining_byte_quota', undefined);
    this.model.unset('remaining_byte_quota');
    expect(this.model.canCreateDatasets()).toEqual(false);
  });

  it('hasFeatureFlagEnabled', function () {
    var flagOK = 'test_flag';
    var feature_flags = [];
    feature_flags.push(flagOK);
    this.model.set('feature_flags', feature_flags);

    expect(this.model.featureEnabled(flagOK)).toEqual(true);
    expect(this.model.featureEnabled('flagWrong')).toEqual(false);
  });

  describe('.upgradeContactEmail', function () {
    describe('when is a normal user', function () {
      beforeEach(function () {
        spyOn(this.model, 'isInsideOrg').and.returnValue(false);
      });

      it('should return the general support email', function () {
        expect(this.model.upgradeContactEmail()).toEqual('support@carto.com');
      });
    });

    describe('when us a organization user', function () {
      beforeEach(function () {
        spyOn(this.model, 'isInsideOrg').and.returnValue(true);
      });

      describe('when user is also admin of organization', function () {
        beforeEach(function () {
          spyOn(this.model, 'isOrgOwner').and.returnValue(true);
        });

        it('should return enterprise support email', function () {
          expect(this.model.upgradeContactEmail()).toEqual('enterprise-support@carto.com');
        });
      });

      describe('when user is a normal organization member', function () {
        beforeEach(function () {
          this.model._organizationModel._ownerModel = new UserModel({
            email: 'owner@org.com'
          }, {
            configModel: 'c'
          });
        });

        it('should return the organiation owner email', function () {
          expect(this.model.upgradeContactEmail()).toEqual('owner@org.com');
        });
      });
    });
  });

  describe('.nameOrUsername', function () {
    it('should return the name or username as fallback if name is not available', function () {
      this.model.set('username', 'kalle');
      expect(this.model.nameOrUsername()).toEqual('kalle');

      this.model.set('name', 'Kalle');
      expect(this.model.nameOrUsername()).toEqual('Kalle');

      this.model.set('last_name', 'Anka');
      expect(this.model.nameOrUsername()).toEqual('Kalle Anka');

      this.model.set('name', '');
      expect(this.model.nameOrUsername()).toEqual('Anka');
    });
  });
});
