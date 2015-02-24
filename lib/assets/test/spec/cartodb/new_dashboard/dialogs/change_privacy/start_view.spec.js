var StartView = require('../../../../../../javascripts/cartodb/new_dashboard/dialogs/change_privacy/start_view');
var PrivacyOptions = require('../../../../../../javascripts/cartodb/new_dashboard/dialogs/change_privacy/options_collection');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_dashboard/dialogs/change_privacy/start_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe',
      actions: {
        private_tables: true,
        private_maps: true
      }
    });

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);

    this.view = new StartView({
      vis: this.vis,
      user: this.user,
      privacyOptions: this.privacyOptions
    });
    this.view.render();
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

  it('should not render the password input', function() {
    expect(this.innerHTML()).not.toContain('<input');
  });

  it('should not disable the save button', function() {
    expect(this.innerHTML()).not.toContain('is-disabled');
  });

  it('should not render the share dialog', function() {
    expect(this.innerHTML()).not.toContain('Share this');
  });

  describe('given user do not have all privacy options available', function() {
    beforeEach(function() {
      this.user.get('actions').private_maps = false;
      this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);
    });

    describe('and has a upgradeUrl', function() {
      beforeEach(function() {
        this.view = new StartView({
          vis: this.vis,
          user: this.user,
          upgradeUrl: '/account/upgrade',
          privacyOptions: this.privacyOptions
        });
        this.view.render();
      });

      it('should render the upgrade banner', function() {
        expect(this.innerHTML()).toContain('/account/upgrade');
      });
    });

    describe('and has no upgradeUrl', function() {
      beforeEach(function() {
        this.view = new StartView({
          vis: this.vis,
          user: this.user,
          upgradeUrl: '',
          privacyOptions: this.privacyOptions
        });
        this.view.render();
      });

      it('should not render the upgrade banner', function() {
        expect(this.innerHTML()).not.toContain('upgrade');
      });
    });
  });

  describe('given user can share permission', function() {
    beforeEach(function() {
      // User can share permissions if part of organization, no special feature flag/user actions required
      this.user = new cdbAdmin.User({
        username: 'pepe',
        actions: {},
        organization: {
          users: []
        }
      });
      this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);

      this.view = new StartView({
        vis: this.vis,
        user: this.user,
        upgradeUrl: '',
        privacyOptions: this.privacyOptions
      });
      this.view.render();
    });

    it('should render the share permissions banner', function() {
      expect(this.innerHTML()).toContain('Share this');
    });

    describe('on click .js-share', function() {
      beforeEach(function() {
        spyOn(this.view, 'killEvent');
        spyOn(this.view, 'trigger');

        this.view.$('.js-share').click();
      });

      it('should kill event', function() {
        expect(this.view.killEvent).toHaveBeenCalled();
      });

      it('should fire a click:share event', function() {
        expect(this.view.trigger).toHaveBeenCalledWith('click:share');
      });
    });
  });

  describe('on click .js-option', function() {
    beforeEach(function() {
      this.select = function(index) {
        $(this.view.$('.js-option')[index]).click();
      }
    });

    it('should have selected item', function() {
      expect(this.privacyOptions.at(1).get('selected')).toBeFalsy();

      this.select(1);
      expect(this.privacyOptions.at(1).get('selected')).toBeTruthy();

      this.select(0);
      expect(this.privacyOptions.at(0).get('selected')).toBeTruthy();
      expect(this.privacyOptions.at(1).get('selected')).toBeFalsy();
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

  describe('on click .js-save', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
      this.view.bind('click:save', function() {
        this.clickedSave = true;
      }, this);

      this.view.$('.js-save').click();
    });

    it('should kill event', function() {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should stop listening on events while processing', function() {
      expect(this.clickedSave).toBeTruthy();
    });
  });
});
