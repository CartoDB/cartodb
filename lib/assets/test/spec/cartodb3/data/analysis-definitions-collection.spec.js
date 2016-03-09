var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      configModel: {}
    });
  });

  describe('.nextId', function () {
    it('should generate a new id for a given source id', function () {
      expect(this.collection.nextId('A0')).toEqual('A1');
      expect(this.collection.nextId('Z9000')).toEqual('Z9001'); // ITS OVER 9000
      expect(this.collection.nextId('ZAB9')).toEqual('ZAB10'); // ITS OVER 9000
    });

    it('should throw an error if given invalid source id', function () {
      var c = this.collection;
      expect(function () { c.nextId('1X2'); }).toThrow();
      expect(function () { c.nextId(); }).toThrow();
      expect(function () { c.nextId(''); }).toThrow();
      expect(function () { c.nextId(123); }).toThrow();
      expect(function () { c.nextId('wtf'); }).toThrow();
      expect(function () { c.nextId('A'); }).toThrow();
      expect(function () { c.nextId('123'); }).toThrow();
      expect(function () { c.nextId(true); }).toThrow();
      expect(function () { c.nextId({}); }).toThrow();
    });
  });
});
