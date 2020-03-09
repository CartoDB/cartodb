const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');
const UpgradeMessage = require('dashboard/components/upgrade-message-view');

const UPGRADE_URL = 'http://pepe.carto.com/account/matatastatic/upgrade';

describe('dashboard/components/upgrade_message_view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      upgrade_url: UPGRADE_URL
    });

    this.user = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      quota_in_bytes: 314572800,
      remaining_byte_quota: 313876480
    }, {
      configModel: this.configModel
    });
    this.user.isCloseToLimits = function () { return true; };
    this.user.isEnterprise = function () { return false; };

    this.view = new UpgradeMessage({
      userModel: this.user,
      configModel: this.configModel
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('You\'re reaching your account limits.');
      expect(this.view.$el.html()).toContain('<a href="' + UPGRADE_URL + '" class="UpgradeElement-infoText">');
    });

    describe('is not close to limits', function () {
      it('should render properly', function () {
        this.user.isCloseToLimits = function () { return false; };
        this.user.isEnterprise = function () { return false; };

        this.view.render();

        expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="UpgradeElement-infoText">');
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

          expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="UpgradeElement-infoText">');
        });
      });

      describe('is org owner', function () {
        beforeEach(function () {
          this.user.isOrgOwner = function () { return true; };
        });

        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$el.html()).toContain('<a href="' + UPGRADE_URL + '" class="UpgradeElement-infoText">');
          });
        });
      });
    });

    describe('cartodb_com_hosted', function () {
      describe('.render', function () {
        it('should render properly', function () {
          this.configModel.set('cartodb_com_hosted', true);

          this.view.render();

          expect(this.view.$el.html()).not.toContain('<a href="' + UPGRADE_URL + '" class="UpgradeElement-infoText">');
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
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });
});
