var cdb = require('cartodb.js-v3');
var PrivacyOptions = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/options_collection');

describe('common/dialogs/change_privacy/options_collection', function() {
  it('should only allow one selected item at a time', function() {
    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    // A normal user
    this.user = new cdb.admin.User({
      actions: {
        private_tables: true,
        private_maps: true
      }
    });
    this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);
    this.privacyOptions.each(function(option) {
      option.set('selected', true);
    });

    var selected = this.privacyOptions.where({ selected: true });
    expect(selected.length).toEqual(1);
    expect(selected[0]).toEqual(this.privacyOptions.last());
  });

  describe('.byVisAndUser', function() {
    beforeEach(function() {
      this.vis = new cdb.admin.Visualization({
        type: 'derived',
        privacy: 'PUBLIC'
      });

      // A normal user
      this.user = new cdb.admin.User({
        actions: {
          private_tables: true,
          private_maps: false
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
          expect(this.firstItem({ privacy: 'PUBLIC' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'LINK' }).get('disabled')).toBeTruthy();
          expect(this.firstItem({ privacy: 'PASSWORD' }).get('disabled')).toBeTruthy();
          expect(this.firstItem({ privacy: 'PRIVATE' }).get('disabled')).toBeTruthy();
        });
      });

      describe('and an user with private maps enabled', function() {
        beforeEach(function() {
          this.user.get('actions').private_maps = true;
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options', function() {
          expect(this.privacyOptions.length).toEqual(4);
        });

        it('should have all options enabled', function() {
          expect(this.firstItem({ privacy: 'PUBLIC' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'LINK' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'PASSWORD' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'PRIVATE' }).get('disabled')).toBeFalsy();
        });
      });
    });

    describe('given a table', function() {
      beforeEach(function() {
        this.vis.set('type', 'table');
      });

      describe('and a user with private tables disabled', function() {
        beforeEach(function() {
          this.user.get('actions').private_tables = false;
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options except for the password-protection', function() {
          expect(this.privacyOptions.length).toEqual(3);
          expect(this.privacyOptions.where({ privacy: 'PASSWORD' }).length).toEqual(0);
        });

        it('should only have public option enabled', function() {
          expect(this.firstItem({ privacy: 'PUBLIC' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'LINK' }).get('disabled')).toBeTruthy();
          expect(this.firstItem({ privacy: 'PRIVATE' }).get('disabled')).toBeTruthy();
        });
      });

      describe('and an user with private tables enabled', function() {
        beforeEach(function() {
          this.user.get('actions').private_tables = true;
          this.createNewPrivacyOptions.call(this);
        });

        it('should return all privacy options except for the password-protection', function() {
          expect(this.privacyOptions.length).toEqual(3);
          expect(this.privacyOptions.where({ privacy: 'PASSWORD' }).length).toEqual(0);
        });

        it('should have all options enabled', function() {
          expect(this.firstItem({ privacy: 'PUBLIC' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'LINK' }).get('disabled')).toBeFalsy();
          expect(this.firstItem({ privacy: 'PRIVATE' }).get('disabled')).toBeFalsy();
        });
      });
    });
  });
});
