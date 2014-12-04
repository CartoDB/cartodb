describe("cdb.admin.Navigation", function() {
  describe('.upgradeUrl', function() {
    describe('given an User', function() {
      beforeEach(function() {
        this.user = new cdb.admin.User({ username: 'pepe' });

        this.navigation = new cdb.admin.Navigation({
          account_host: 'cartodb.com'
        });
      });

      it('should return the URL where the user upgrades', function() {
        expect(this.navigation.upgradeUrl(this.user)).toMatch('//cartodb.com/account/pepe/upgrade');
      });
    });
  });
});

