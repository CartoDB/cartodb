/**
 * Common test cases for a option model. 
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForOptionModel.call(this);
 */
module.exports = function(opts) {
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
      expect(this.vis.save.calls.argsFor(0)[0]).toEqual(opts.expectedSaveAttrs);
    });

    it('should not update the vis parent collection until jqXHR resolves', function() {
      expect(this.vis.save.calls.argsFor(0)[1]).toEqual({ wait: true });
    });

    it('should return a jqXHR object', function() {
      expect(this.result).toBe(this.jqXHR);
    });
  });

};
