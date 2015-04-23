var StartView = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/start_view');
var ViewModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/view_model');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_common/dialogs/change_privacy/start_view', function() {
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

    this.createView = function() {
      this.viewModel = new ViewModel({
        vis: this.vis,
        user: this.user
      });
      spyOn(this.viewModel, 'changeState');
      spyOn(this.viewModel, 'save');

      this.view = new StartView({
        viewModel: this.viewModel
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
      this.user = new cdbAdmin.User({
        username: 'pepe',
        actions: {},
        organization: {
          users: []
        }
      });

      this.createView();
    });

    it('should render the share permissions banner', function() {
      expect(this.innerHTML()).toContain('Share this');
    });

    describe('on click .js-share', function() {
      beforeEach(function() {
        this.view.$('.js-share').click();
      });

      it('should kill event', function() {
        expect(this.view.killEvent).toHaveBeenCalled();
      });

      it('should change state to share view', function() {
        expect(this.viewModel.changeState).toHaveBeenCalledWith('Share');
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
      var privacyOptions = this.viewModel.get('privacyOptions');
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
      this.passwordOption = this.viewModel.get('privacyOptions').where({ privacy: 'PASSWORD' })[0];
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
      this.view.$('.js-save').click();
    });

    it('should kill event', function() {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should stop listening on events while processing', function() {
      expect(this.viewModel.save).toHaveBeenCalled();
    });
  });
});
