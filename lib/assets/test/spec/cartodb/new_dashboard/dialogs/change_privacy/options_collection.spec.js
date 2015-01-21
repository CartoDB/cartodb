var PrivacyOptions = require('new_dashboard/dialogs/change_privacy/options_collection');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/change_privacy/options_collection', function() {
  describe('.byVisAndUser', function() {
    beforeEach(function() {
      this.vis = new cdbAdmin.Visualization({
        type: 'derived',
        privacy: 'public'
      });
      
      this.user = new cdbAdmin.User({
        actions: {
          private_maps: false,
          private_tables: false
        }
      });
      
      // Convenient helper methods
      
      this.createNewPrivacyOptions = function() {
        this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);
      };
      
      this.firstItem = function(whereAttrs) {
        return this.privacyOptions.where(whereAttrs)[0];
      }
    });

    it('should only allow one selected item at a time', function() {
      this.createNewPrivacyOptions();
      this.selected = function() {
        return this.privacyOptions.where({ selected: true });
      }.bind(this);

      expect(this.selected().length).toEqual(1);
      expect(this.selected()[0]).toEqual(this.privacyOptions.at(0));

      this.privacyOptions.at(2).set('selected', true);
      expect(this.selected().length).toEqual(1);
      expect(this.selected()[0]).toEqual(this.privacyOptions.at(2));

      this.privacyOptions.at(1).set('selected', true);
      expect(this.selected().length).toEqual(1);
      expect(this.selected()[0]).toEqual(this.privacyOptions.at(1));
    });
    
    describe('given a visualization', function() {
      beforeEach(function() {
        this.vis.set('type', 'derived');
      });

      describe('and a normal user', function() {
        beforeEach(function() {
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options', function() {
          expect(this.privacyOptions.length).toEqual(4);
        });

        it('should only have the public option enabled', function() {
          expect(this.firstItem({ type: 'public' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'link' }).get('disabled')).toBeTruthy();
          expect(this.firstItem({ type: 'private' }).get('disabled')).toBeTruthy();
        });
      });

      describe('and an enterprise user', function() {
        beforeEach(function() {
          this.user.get('actions').private_tables = true;
          this.user.get('actions').private_maps = true;
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options', function() {
          expect(this.privacyOptions.length).toEqual(4);
        });

        it('should have all options enabled', function() {
          expect(this.firstItem({ type: 'public' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'link' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'password' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'private' }).get('disabled')).toBeFalsy();
        });
      });
    });
  
    describe('given a table', function() {
      beforeEach(function() {
        this.vis.set('type', 'table');
      });

      describe('and a normal user', function() {
        beforeEach(function() {
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options except for the password-protection', function() {
          expect(this.privacyOptions.length).toEqual(3);
          expect(this.privacyOptions.where({ type: 'password' }).length).toEqual(0);
        });

        it('should only have the public option enabled', function() {
          expect(this.firstItem({ type: 'public' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'link' }).get('disabled')).toBeTruthy();
          expect(this.firstItem({ type: 'private' }).get('disabled')).toBeTruthy();
        });
      });

      describe('and an enterprise user', function() {
        beforeEach(function() {
          this.user.get('actions').private_tables = true;
          this.user.get('actions').private_maps = true;
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options except for the password-protection', function() {
          expect(this.privacyOptions.length).toEqual(3);
          expect(this.privacyOptions.where({ type: 'password' }).length).toEqual(0);
        });

        it('should have all options enabled', function() {
          expect(this.firstItem({ type: 'public' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'link' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ type: 'private' }).get('disabled')).toBeFalsy();
        });
      });
    });
  });
});


