var PrivacyOption = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/option_model');
var sharedForOptionModel = require('./shared_for_option_model');

describe('new_common/dialogs/change_privacy/option_model', function() {
  beforeEach(function() {
    this.model = new PrivacyOption({});
  });

  sharedForOptionModel.call(this, {
    expectedSaveAttrs: {
      privacy: 'new-privacy-value',
      password: undefined
    }
  });

  describe('.canSave' , function() {
    describe('given option is disabled', function() {
      beforeEach(function() {
        this.model.set('disabled', true);
      });

      it('should return false', function() {
        expect(this.model.canSave()).toBeFalsy();
      });
    });

    describe('given option is enabled', function() {
      beforeEach(function() {
        this.model.set('disabled', false);
      });

      it('should return true', function() {
        expect(this.model.canSave()).toBeTruthy();
      });
    });
  });
});
