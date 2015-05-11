var sendUsageToMixpanel = require('../../../../javascripts/cartodb/dashboard/send_usage_to_mixpanel');

/**
 * It's not a thoroughl test since testing all combinations would be tedious.
 * At least should catch obvious errors (besides, before this test this code weren't event tested).
 */
describe('dashboard/send_usage_to_mixpanel', function() {
  var send = function() {
    sendUsageToMixpanel(this.mixpanel, this.user, this.isFirstTimeViewingDashboard, this.isJustLoggedIn);
  };

  beforeEach(function() {
    this.mixpanel = jasmine.createSpyObj('mixpanel', ['track']);
    this.mixpanel.people = jasmine.createSpyObj('mixpanel.people', ['increment']);
  });

  describe('given user is in an organisation', function() {
    beforeEach(function() {
      this.user = new cdb.admin.User({
        account_type: 'Enterprise'
      });

      spyOn(this.user, 'isInsideOrg').and.returnValue(true);
      this.user.organization = jasmine.createSpyObj('organization', ['get']);
      this.user.organization.get.and.returnValue("Pepe's Bodega");

      this.expectedPayload = {
        account_type: 'Enterprise',
        enterprise_org: "Pepe's Bodega"
      };
    });

    it('should track dashboard views', function() {
      send.call(this);
      expect(this.mixpanel.track).toHaveBeenCalledWith('Dashboard viewed', this.expectedPayload);
    });

    describe('given is first time viewing dashboard', function() {
      beforeEach(function() {
        this.isFirstTimeViewingDashboard = true;
        send.call(this);
      });

      it('should have fetched organization name for payload', function() {
        expect(this.user.organization.get).toHaveBeenCalledWith('name');
      });

      it('should track dashboard viewed for the first time w/ user payload', function() {
        expect(this.mixpanel.track).toHaveBeenCalledWith('Dashboard viewed for the first time', this.expectedPayload)
      });
    });

    describe('given is just logged in before display dashboard', function() {
      beforeEach(function() {
        this.isJustLoggedIn = true;
        send.call(this);
      });

      it('should have fetched organization name for payload', function() {
        expect(this.user.organization.get).toHaveBeenCalledWith('name');
      });

      it('should track dashboard viewed for the first time w/ user payload', function() {
        expect(this.mixpanel.track).toHaveBeenCalledWith('Logged in');
      });

      it('should increment the login counts', function() {
        expect(this.mixpanel.people.increment).toHaveBeenCalledWith('login_count', 1);
      });
    });
  });
});
