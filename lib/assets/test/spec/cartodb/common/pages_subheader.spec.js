var cdb = require('cartodb.js-v3');
var PagesSubheader = require('../../../../javascripts/cartodb/common/pages_subheader');

var BILLING_LINK = '/account/pepe/plan';

describe('common/pages_subheader', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      db_size_in_bytes: 16384000,
      quota_in_bytes: 1073741824,
      plan_url: BILLING_LINK
    });

    this.view = new PagesSubheader({
      user: this.user
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<a class="Filters-link" href="' + BILLING_LINK + '">');
      expect(this.view.$el.html()).toContain('<span class="bar-2 " style="width: 2%"></span>');
      expect(this.view.$el.html()).toContain('<span class="CDB-Text CDB-Size-medium u-altTextColor">15.62MB of 1GB</span>');
      expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/profile" class="SideMenu-typeLink ">Profile</a></li>');
      expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/account" class="SideMenu-typeLink ">Account</a></li>');
      expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/your_apps" class="SideMenu-typeLink ">API keys</a></li>');
      expect(this.view.$el.html()).toContain('<a href="mailto:support@carto.com">Contact support</a>');
      expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
    });

    describe('page is Profile', function () {
      it('should render properly', function () {
        spyOn(this.view, 'getPath').and.returnValue('/profile');

        this.view.render();

        expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/profile" class="SideMenu-typeLink is-selected">Profile</a></li>');
      });
    });

    describe('page is Account', function () {
      it('should render properly', function () {
        spyOn(this.view, 'getPath').and.returnValue('/account');

        this.view.render();

        expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/account" class="SideMenu-typeLink is-selected">Account</a></li>');
      });
    });

    describe('page is API keys', function () {
      it('should render properly', function () {
        spyOn(this.view, 'getPath').and.returnValue('/your_apps');

        this.view.render();

        expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/your_apps" class="SideMenu-typeLink is-selected">API keys</a></li>');
      });
    });
  });

  describe('cartodb_com_hosted', function () {
    describe('.render', function () {
      it('should render properly', function () {
        cdb.config.set('cartodb_com_hosted', true);

        this.view.render();

        expect(this.view.$el.html()).not.toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      this.user.isInsideOrg = function () { return true; };
      this.user.isOrgOwner = function () { return false; };

      this.user.organization = new cdb.core.Model({
        name: 'carto'
      });
      this.user.organization.owner = new cdb.core.Model({
        email: 'owner@carto.com'
      });
      this.user.organization.isOrgAdmin = function () { return false; };
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$el.html()).not.toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
        expect(this.view.$el.html()).toContain('<a href="mailto:owner@carto.com">Contact your org. admin</a>');
      });
    });

    describe('is org owner', function () {
      beforeEach(function () {
        this.user.isOrgOwner = function () { return true; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).toContain('<a href="mailto:enterprise-support@carto.com">Contact your VIP support</a>');
        });
      });
    });

    describe('is org admin', function () {
      beforeEach(function () {
        this.user.organization.isOrgAdmin = function () { return true; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/organization" class="SideMenu-typeLink ">Organization settings</a></li>');
        });

        describe('page is organization', function () {
          it('should render properly', function () {
            spyOn(this.view, 'getPath').and.returnValue('/organization');

            this.view.render();

            expect(this.view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/organization" class="SideMenu-typeLink is-selected">Organization settings</a></li>');
          });
        });
      });
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
