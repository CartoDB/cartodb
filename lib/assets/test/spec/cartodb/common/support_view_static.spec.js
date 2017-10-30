var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var SupportView = require('../../../../javascripts/cartodb/common/support_view_static');

var DISPLAY_EMAIL = 'admin@carto.com';

describe('common/support_view_static', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });

    this.view = new SupportView({
      user: this.user
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('For all technical questions, contact our community support forum.');
      expect(this.view.$el.html()).toContain('If you experience any problems with the CARTO service, feel free to <a href="mailto:support@carto.com">contact us</a>.');
      expect(this.view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">Community support</span>');
    });

    describe('user is viewer', function () {
      it('should render properly', function () {
        spyOn(this.user, 'isViewer').and.returnValue(true);
        spyOn(this.view, '_getOrgAdminEmail').and.returnValue('admin@carto.com');

        this.view.render();

        expect(this.view.$el.html()).toContain('Contact the <a href="mailto:admin@carto.com">organization administrator</a> to become a builder.');
        expect(this.view.$el.html()).toContain('You will be able to create your own maps!');
      });
    });

    describe('user is org', function () {
      it('should render properly', function () {
        spyOn(this.view, '_getUserType').and.returnValue('org');
        spyOn(this.view, '_getOrgAdminEmail').and.returnValue('admin@carto.com');

        this.view.render();

        expect(this.view.$el.html()).toContain('Contact the <a href="mailto:admin@carto.com">organization administrator</a> for support.');
        expect(this.view.$el.html()).toContain('Remember that there is a lot of information in our <a href="http://gis.stackexchange.com/questions/tagged/carto" target="_blank">community forums</a>.');
        expect(this.view.$el.html()).toContain('<a href="mailto:admin@carto.com" class="SupportBanner-link CDB-Button CDB-Button--secondary">');
      });
    });

    describe('user is org admin', function () {
      it('should render properly', function () {
        spyOn(this.view, '_getUserType').and.returnValue('org_admin');

        this.view.render();

        expect(this.view.$el.html()).toContain('As a paying customer, you have access to our dedicated support.');
        expect(this.view.$el.html()).toContain('Remember that there is a lot of information in our <a href="http://gis.stackexchange.com/questions/tagged/carto" target="_blank">community forums</a>.');
        expect(this.view.$el.html()).toContain('<a href="mailto:enterprise-support@carto.com" class="SupportBanner-link CDB-Button CDB-Button--secondary">');
      });
    });

    describe('user is client', function () {
      it('should render properly', function () {
        spyOn(this.view, '_getUserType').and.returnValue('client');

        this.view.render();

        expect(this.view.$el.html()).toContain('As a paying customer, you have access to our dedicated support.');
        expect(this.view.$el.html()).toContain('Remember that there is a lot of information in our <a href="http://gis.stackexchange.com/questions/tagged/carto" target="_blank">community forums</a>.');
        expect(this.view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">Contact us</span>');
      });
    });

    describe('user is internal', function () {
      it('should render properly', function () {
        spyOn(this.view, '_getUserType').and.returnValue('internal');

        this.view.render();

        expect(this.view.$el.html()).toContain('You are part of CARTO, you deserve outstanding support.');
        expect(this.view.$el.html()).toContain('Don\'t forget to share your knowledge in our <a href="http://gis.stackexchange.com/questions/tagged/carto" target="_blank">community forums</a>.');
        expect(this.view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">Contact us</span>');
      });
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view.user).toEqual(this.user);
    });
  });

  describe('._getUserType', function () {
    it('should get user type', function () {
      expect(this.view._getUserType()).toBe('regular');
    });

    describe('user is org owner', function () {
      it('should get user type', function () {
        spyOn(this.view.user, 'isOrgOwner').and.returnValue(true);

        expect(this.view._getUserType()).toBe('org_admin');
      });
    });

    describe('user is internal', function () {
      it('should get user type', function () {
        _.each(['internal', 'partner', 'ambassador'], function (account) {
          this.user.set('account_type', account);

          expect(this.view._getUserType()).toBe('internal');
        }, this);
      });
    });

    describe('user is not free', function () {
      it('should get user type', function () {
        this.user.set('account_type', 'wadus');

        expect(this.view._getUserType()).toBe('client');
      });
    });
  });

  describe('is inside org', function () {
    beforeEach(function () {
      spyOn(this.user, 'isInsideOrg').and.returnValue(true);
    });

    describe('._getOrgAdminEmail', function () {
      it('should get org admin email', function () {
        this.user.organization = {
          display_email: DISPLAY_EMAIL
        };

        expect(this.view._getOrgAdminEmail()).toBe(DISPLAY_EMAIL);
      });
    });

    describe('._getUserType', function () {
      it('should get user type', function () {
        expect(this.view._getUserType()).toBe('org');
      });
    });
  });

  describe('._getOrgAdminEmail', function () {
    it('should return null', function () {
      expect(this.view._getOrgAdminEmail()).toBeNull();
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });
});
