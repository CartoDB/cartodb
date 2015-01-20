var PrivacyOption = require('new_dashboard/dialogs/change_privacy/options_collection');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/change_privacy/options_collection', function() {
  describe('.classNames', function() {
    beforeEach(function() {
      this.model = new PrivacyOption({});
    });

    describe('given both attributes are not set', function() {
      it('should return empty string', function() {
        expect(this.model.classNames()).toEqual('');
      });
    });

    describe('given at least one attr is set to true', function() {
      it('should return the states in a space-separated string', function() {
        this.model.set('disabled', true);
        expect(this.model.classNames()).toEqual('is-disabled');

        this.model.set('selected', true);
        expect(this.model.classNames()).toEqual('is-disabled is-selected');

        this.model.set('disabled', false);
        expect(this.model.classNames()).toEqual('is-selected');
      });
    });
  });
});


