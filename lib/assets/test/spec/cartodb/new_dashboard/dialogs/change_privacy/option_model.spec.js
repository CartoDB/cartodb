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
      beforeEach(function() {
        this.model = new PrivacyOption({});
      });
      
      it('should return the states in a space-separated string', function() {
        this.model.set('disabled', true);
        expect(this.model.classNames()).toEqual('is-disabled');

        this.model.set({ disabled: false, selected: true });
        expect(this.model.classNames()).toEqual('is-selected');
      });
    });
  });

  describe('.saveToVis', function() {
    beforeEach(function() {
      this.vis = jasmine.createSpyObj('cdb.admin.Visualization', ['save']);
      this.jqXHR = jasmine.createSpyObj('jqXHR', ['done', 'fail']);
      this.vis.save.and.returnValue(this.jqXHR);
      this.model.set('privacy', 'new-privacy-value');
      
      this.result = this.model.saveToVis(this.vis);
    });
    
    it('should set the new privacy setting to the vis model', function() {
      expect(this.vis.save).toHaveBeenCalled();
      expect(this.vis.save.calls.argsFor(0)[0]).toEqual({ privacy: 'new-privacy-value' });
    });

    it('should not update the vis parent collection until jqXHR resolves', function() {
      expect(this.vis.save.calls.argsFor(0)[1]).toEqual({ wait: true });
    });

    it('should return a jqXHR object', function() {
      expect(this.result).toBe(this.jqXHR);
    });
  });
});


