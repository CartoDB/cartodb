const Backbone = require('backbone');
const PagesSubheader = require('dashboard/components/pages-subheader/pages-subheader');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

const BILLING_LINK = '/account/pepe/plan';

describe('dashboard/components/pages-subheader/pages-subheader', function () {
  let user, view;

  const createViewFn = function () {
    user = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      db_size_in_bytes: 16384000,
      quota_in_bytes: 1073741824,
      plan_url: BILLING_LINK
    });

    // Set ConfigModel configuration
    ConfigModelFixture.set('cartodb_com_hosted', false);

    view = new PagesSubheader({
      userModel: user,
      configModel: ConfigModelFixture
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  afterEach(function () {
    view.clean();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/profile" class="SideMenu-typeLink ">Profile</a></li>');
      expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/account" class="SideMenu-typeLink ">Account</a></li>');
      expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/dashboard/app_permissions" class="SideMenu-typeLink ">App permissions</a></li>');
      expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
      expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/your_apps" class="SideMenu-typeLink ">Developer Settings</a></li>');
    });

    describe('page is Profile', function () {
      it('should render properly', function () {
        spyOn(view, 'getPath').and.returnValue('/profile');

        view.render();

        expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/profile" class="SideMenu-typeLink is-selected">Profile</a></li>');
      });
    });

    describe('page is Account', function () {
      it('should render properly', function () {
        spyOn(view, 'getPath').and.returnValue('/account');

        view.render();

        expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/account" class="SideMenu-typeLink is-selected">Account</a></li>');
      });
    });

    describe('page is App permissions', function () {
      it('should render properly', function () {
        spyOn(view, 'getPath').and.returnValue('/dashboard/app_permissions');

        view.render();

        expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/dashboard/app_permissions" class="SideMenu-typeLink is-selected">App permissions</a></li>');
      });
    });

    describe('page is API keys', function () {
      it('should render properly', function () {
        spyOn(view, 'getPath').and.returnValue('/your_apps');

        view.render();

        expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/your_apps" class="SideMenu-typeLink is-selected">Developer Settings</a></li>');
      });
    });
  });

  describe('cartodb_com_hosted', function () {
    describe('.render', function () {
      it('should render properly', function () {
        ConfigModelFixture.set('cartodb_com_hosted', true);

        view.render();

        expect(view.$el.html()).not.toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      user.isInsideOrg = function () { return true; };
      user.isOrgOwner = function () { return false; };

      user.organization = new Backbone.Model({
        name: 'carto'
      });
      user.organization.owner = new Backbone.Model({
        email: 'owner@carto.com'
      });
      user.organization.isOrgAdmin = function () { return false; };
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$el.html()).not.toContain('<li class="SideMenu-typeItem"><a href="' + BILLING_LINK + '" class="SideMenu-typeLink">Billing</a></li>');
      });
    });

    describe('is org admin', function () {
      beforeEach(function () {
        user.organization.isOrgAdmin = function () { return true; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          view.render();

          expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/organization" class="SideMenu-typeLink ">Organization settings</a></li>');
        });

        describe('page is organization', function () {
          it('should render properly', function () {
            spyOn(view, 'getPath').and.returnValue('/organization');

            view.render();

            expect(view.$el.html()).toContain('<li class="SideMenu-typeItem"><a href="/organization" class="SideMenu-typeLink is-selected">Organization settings</a></li>');
          });
        });
      });
    });
  });

  it('should not have leaks', function () {
    view.render();

    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
