var PrivacyOption = require('new_dashboard/dialogs/change_privacy/option_model');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/change_privacy/option_model', function() {
  beforeEach(function() {
    this.model = new PrivacyOption({});
  });
  
  describe('given a disabled item', function() {
    it('should not be able to set it to be selected', function() {
      expect(this.model.set('disabled', true)).toBeTruthy();
      expect(this.model.set('selected', true)).toBeFalsy();
    });
  });
  
  describe('.classNames', function() {
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


