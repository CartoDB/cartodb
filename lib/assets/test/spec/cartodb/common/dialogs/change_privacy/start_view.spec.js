var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var StartView = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/start_view');
var PrivacyOptions = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/options_collection');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/start_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      actions: {
        private_tables: true,
        private_maps: true
      }
    });

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.createView = function() {
      this.view && this.view.clean();
      this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);
      this.view = new StartView({
        vis: this.vis,
        user: this.user,
        privacyOptions: this.privacyOptions
      });
      spyOn(this.view, 'killEvent');

      this.view.render();
    };

    this.createView();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have the first (public) option is selected by default', function() {
    expect(this.innerHTML()).toMatch('is-selected.+data-index="0"');
  });

  it('should not render the upgrade banner by default', function() {
    expect(this.innerHTML()).not.toContain('upgrade');
  });

  it('should render the password input', function() {
    expect(this.innerHTML()).toContain('<input');
  });

  it('should not disable the save button', function() {
    expect(this.innerHTML()).not.toContain('is-disabled');
  });

  it('should not render the share dialog', function() {
    expect(this.innerHTML()).not.toContain('Share it');
  });

  describe('given user do not have all privacy options available', function() {
    beforeEach(function() {
      this.user.get('actions').private_maps = false;
      this.createView();
    });

    describe('when has a upgradeUrl', function() {
      beforeEach(function() {
        cdb.config.set('upgrade_url', '/account/upgrade');
        this.createView();
      });

      it('should render the upgrade banner', function() {
        expect(this.innerHTML()).toContain('/account/upgrade');
      });

      afterEach(function() {
        cdb.config.set('upgrade_url', '');
      });
    });

    describe('and has no upgradeUrl', function() {
      it('should not render the upgrade banner', function() {
        expect(this.innerHTML()).not.toContain('upgrade');
      });
    });
  });

  describe('given user can share permission', function() {
    beforeEach(function() {
      // User can share permissions if part of organization, no special feature flag/user actions required
      this.user = new cdb.admin.User({
        username: 'pepe',
        actions: {},
        organization: {
          users: []
        }
      });

      this.createView();
    });

    it('should render the share permissions banner', function() {
      expect(this.innerHTML()).toContain('Share it');
    });

    describe('on click .js-share', function() {
      beforeEach(function() {
        this.clickedShare = jasmine.createSpy('clickedShare');
        this.view.bind('clickedShare', this.clickedShare);
        this.view.$('.js-share').click();
      });

      it('should kill event', function() {
        expect(this.view.killEvent).toHaveBeenCalled();
      });

      it('should trigger clickedShare event', function() {
        expect(this.clickedShare).toHaveBeenCalled();
      });
    });

    describe('when shared with organization', function() {
      beforeEach(function() {
        spyOn(this.vis.permission, 'isSharedWithOrganization').and.returnValue(true);
        spyOn(this.vis.permission, 'getUsersWithAnyPermission').and.returnValue([new Backbone.Model({
          name: 'buffel&båg',
          avatar_url: 'org-avatar.png'
        })]);
        this.view.render();
      });

      it('should render shared with organization', function() {
        expect(this.innerHTML()).toContain('Shared with your whole organization');
      });

      it('should render the org avatar', function() {
        expect(this.innerHTML()).toContain('buffel');
        expect(this.innerHTML()).toContain('org-avatar.png');
      });
    });

    describe('when shared with users', function() {
      beforeEach(function() {
        spyOn(this.vis.permission, 'isSharedWithOrganization').and.returnValue(false);
        var users = [];
        _.times(11, function(i) {
          users.push(new Backbone.Model({
            username: 'User #' + i,
            avatar_url: 'org-avatar' + i + '.png'
          }));
        });
        spyOn(this.vis.permission, 'getUsersWithAnyPermission').and.returnValue(users);
        this.view.render();
      });

      it('should render shared with organization', function() {
        expect(this.innerHTML()).toContain('Shared with 11 people');
      });

      it('should render the first users', function() {
        expect(this.innerHTML()).toContain('User #4');
        expect(this.innerHTML()).toContain('org-avatar4.png');
        expect(this.innerHTML()).not.toContain('User #5');
        expect(this.innerHTML()).not.toContain('org-avatar5.png');
      });
    });
  });

  describe('on click .js-option', function() {
    beforeEach(function() {
      this.select = function(index) {
        $(this.view.$('.js-option')[index]).click();
      };
    });

    it('should have selected item', function() {
      var privacyOptions = this.privacyOptions;
      expect(privacyOptions.at(1).get('selected')).toBeFalsy();

      this.select(1);
      expect(privacyOptions.at(1).get('selected')).toBeTruthy();

      this.select(0);
      expect(privacyOptions.at(0).get('selected')).toBeTruthy();
      expect(privacyOptions.at(1).get('selected')).toBeFalsy();
    });

    it("should set the .is-selected class on the selected item's DOM", function() {
      expect(this.innerHTML()).not.toMatch('is-selected.+data-index="1"');

      this.select(1);
      expect(this.innerHTML()).toMatch('is-selected.+data-index="1"');

      this.select(0);
      expect(this.innerHTML()).toMatch('is-selected.+data-index="0"');
      expect(this.innerHTML()).not.toMatch('is-selected.+data-index="1"');
    });
  });

  describe('on select password option', function() {
    beforeEach(function() {
      this.passwordOption = this.privacyOptions.where({ privacy: 'PASSWORD' })[0];
      this.passwordOption.set('selected', true);
    });

    it('should render the password input field', function() {
      expect(this.innerHTML()).toContain('<input ');
    });

    describe('and the password field has no value', function() {
      beforeEach(function() {
        this.passwordOption.set('password', undefined);
      });

      it('should disable the save button', function() {
        expect(this.innerHTML()).toContain('is-disabled');
      });
    });

    describe('and the password has at least some char', function() {
      beforeEach(function() {
        this.passwordOption.set('password', 'f');
      });

      it('should not disable the save button', function() {
        expect(this.innerHTML()).not.toContain('is-disabled');
      });
    });
  });
});
