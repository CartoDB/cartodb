var WidgetsCollection = require('../../src/widgets/widgets-collection');

describe('widgets/widgets-collection', function () {
  beforeEach(function () {
    this.collection = new WidgetsCollection();
  });

  describe('bind', function () {
    it('should disable categoryColors attribute if any other widget enables it', function () {
      this.collection.reset([{ name: 'hello' }, { name: 'howdy' }, { name: 'hey', categoryColors: true }]);
      var mdl1 = this.collection.at(0);
      var mdl2 = this.collection.at(1);
      var mdl3 = this.collection.at(2);
      expect(mdl3.get('categoryColors')).toBeTruthy();
      mdl1.set('categoryColors', true);
      expect(mdl3.get('categoryColors')).toBeFalsy();
      expect(mdl2.get('categoryColors')).toBeUndefined();

      mdl2.set('categoryColors', true);
      expect(mdl1.get('categoryColors')).toBeFalsy();
      expect(mdl3.get('categoryColors')).toBeFalsy();
    });
  });
});
