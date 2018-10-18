var cdb = require('cartodb.js-v3');
var UpgradeMessage = require('../../../../javascripts/cartodb/common/upgrade_message_view_static');

var UPGRADE_URL = 'http://pepe.carto.com/account/matatastatic/upgrade';

describe('common/upgrade_message_view_static', function () {
  beforeEach(function () {
    cdb.config.set('upgrade_url', UPGRADE_URL);

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      quota_in_bytes: 314572800,
      remaining_byte_quota: 313876480
    });
    this.user.isCloseToLimits = function () { return true; };
    this.user.isEnterprise = function () { return false; };

    this.view = new UpgradeMessage({
      model: this.user
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('You\'re reaching your account limits.');
      expect(this.view.$el.html()).toContain('<a href="' + UPGRADE_URL + '" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">');
    });

    describe('is not close to limits', function () {
      it('should render properly', function () {
        this.user.isCloseToLimits = function () { return false; };
        this.user.isEnterprise = function () { return false; };

        this.view.render();

        expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">');
      });
    });

    describe('is inside org', function () {
      beforeEach(function () {
        this.user.isInsideOrg = function () { return true; };
        this.user.isOrgOwner = function () { return false; };
      });

      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">');
        });
      });

      describe('is org owner', function () {
        beforeEach(function () {
          this.user.isOrgOwner = function () { return true; };
        });

        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$el.html()).toContain('<a href="' + UPGRADE_URL + '" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">');
          });
        });
      });
    });

    describe('cartodb_com_hosted', function () {
      describe('.render', function () {
        it('should render properly', function () {
          cdb.config.set('cartodb_com_hosted', true);

          this.view.render();

          expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">');
        });
      });
    });

    describe('don\'t have quota', function () {
      it('should render properly', function () {
        this.user.set('remaining_byte_quota', 0);

        this.view.render();

        expect(this.view.$el.html()).toContain('You have reached your limits.');
      });
    });

    describe('can start trial', function () {
      it('should render properly', function () {
        this.user.canStartTrial = function () { return true; };

        this.view.render();

        expect(this.view.$el.html()).toContain('14 days Free trial');
      });
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });
});
