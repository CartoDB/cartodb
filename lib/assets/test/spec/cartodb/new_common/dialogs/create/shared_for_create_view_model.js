/**
 * Common test cases for a create view models (map or dataset).
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForCreate.call(this);
 */
module.exports = function() {

  describe('.getUpload', function() {
    it('should return an objet', function() {
      expect(this.model.getUpload()).toEqual(jasmine.any(Object));
    });
  });

  describe('.setUpload', function() {
    it('should omit create_vis parameter when upload model changes', function() {
      this.model.setUpload({ create_vis: 'hello', type_guessing: true });
      expect(this.model.upload.get('create_vis')).not.toBe('hello');
    });
  });

};
