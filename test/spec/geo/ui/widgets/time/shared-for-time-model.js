module.exports = function() {
  describe('geo/ui/widgets/time/*model (shared)', function() {
    it('should have a stepDate attr', function() {
      expect(this.model.get('stepDate')).toEqual(jasmine.any(Date));
    });

    it('should have a isRunning attr', function() {
      expect(this.model.get('isRunning')).toEqual(jasmine.any(Boolean));
    });
  });
};
