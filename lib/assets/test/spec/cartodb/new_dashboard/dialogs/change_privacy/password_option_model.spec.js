var PasswordPrivacyOption = require('new_dashboard/dialogs/change_privacy/password_option_model');
var cdbAdmin = require('cdb.admin');
var sharedForOptionModel = require('./shared_for_option_model');

describe('new_dashboard/dialogs/change_privacy/password_option_model', function() {
  beforeEach(function() {
    this.model = new PasswordPrivacyOption({
      password: 'foobar'
    });
  });

  sharedForOptionModel.call(this, {
    expectedSaveAttrs: {
      privacy: 'new-privacy-value',
      password: 'foobar'
    }
  });
  
  describe('.canSave' , function() {
    describe('given option is enabled and has a password string set', function() {
      beforeEach(function() {
        this.model.set({
          disabled: false,
          password: 'f'
        })
      });

      it('should return true', function() {
        expect(this.model.canSave()).toBeTruthy();
      });
    });

    describe('given option is disabled or has no password set', function() {
      beforeEach(function() {
        this.model.set({
          disabled: true,
          password: undefined
        });
      });

      it('should return false', function() {
        expect(this.model.canSave()).toBeFalsy();

        // still missing pwd
        this.model.set({ disabled: false });
        expect(this.model.canSave()).toBeFalsy();
        this.model.set({ disabled: false, password: '' });
        expect(this.model.canSave()).toBeFalsy();
      });
    });
  })
});


