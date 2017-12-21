var PrivacyOption = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/option_model');
var sharedForOptionModel = require('./shared_for_option_model');

describe('common/dialogs/change_privacy/option_model', function() {
  beforeEach(function() {
    this.model = new PrivacyOption({});
  });

  sharedForOptionModel.call(this, {
    expectedSaveAttrs: {
      privacy: 'new-privacy-value',
      password: undefined
    }
  });

  describe('.canSave', function() {
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

  describe('.saveToVis', function() {
    beforeEach(function() {
      this.vis = jasmine.createSpyObj('cdb.admin.Visualization', ['save']);
      this.model.set({
        privacy: 'PASSWORD',
        password: 'for this test'
      });
      this.callbacks = {
        success: function() {},
        error: function() {}
      };
      this.model.saveToVis(this.vis, this.callbacks);
    });

    it('should call vis.save', function() {
      expect(this.vis.save).toHaveBeenCalled();
    });

    it('should save with selected attrs', function() {
      expect(this.vis.save.calls.argsFor(0)[0]).toEqual({
        privacy: 'PASSWORD',
        password: 'for this test'
      });
    });

    it('should wait with triggering err', function() {
      expect(this.vis.save.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ wait: true }));
    });

    it('should pass the callbacks to the save call', function() {
      expect(this.vis.save.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ success: this.callbacks.success }));
      expect(this.vis.save.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ error: this.callbacks.error }));
    });
  });
});
