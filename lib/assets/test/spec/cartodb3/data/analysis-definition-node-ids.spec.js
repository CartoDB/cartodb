var analysisDefinitionNodeIds = require('../../../../javascripts/cartodb3/data/analysis-definition-node-ids');

describe('data/analysis-definition-node-ids', function () {
  describe('.next', function () {
    it('should generate a new id for a given source id', function () {
      expect(analysisDefinitionNodeIds.next('a0')).toEqual('a1');
      expect(analysisDefinitionNodeIds.next('a123')).toEqual('a124');
      expect(analysisDefinitionNodeIds.next('z9000')).toEqual('z9001'); // ITS OVER 9000
      expect(analysisDefinitionNodeIds.next('zab9')).toEqual('zab10'); // ITS OVER 9000
    });

    it('should generate new id for a given backbone model', function () {
      expect(analysisDefinitionNodeIds.next({id: 'a0'})).toEqual('a1');
      expect(analysisDefinitionNodeIds.next({id: 'z9000'})).toEqual('z9001'); // ITS OVER 9000
      expect(analysisDefinitionNodeIds.next({id: 'zab9'})).toEqual('zab10'); // ITS OVER 9000
    });

    it('should generate new id starting from 0 if no sequence number is given', function () {
      expect(analysisDefinitionNodeIds.next('a')).toEqual('a0');
      expect(analysisDefinitionNodeIds.next({id: 'a'})).toEqual('a0');
      expect(analysisDefinitionNodeIds.next('x')).toEqual('x0');
      expect(analysisDefinitionNodeIds.next({id: 'x'})).toEqual('x0');
    });

    it('should throw an error if given invalid source id', function () {
      expect(function () { analysisDefinitionNodeIds.next('A1'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next('1X2'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next(); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next(''); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next(123); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next('123'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next(true); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.next({}); }).toThrow();
    });
  });

  describe('.letter', function () {
    it('should return the letter from an id', function () {
      expect(analysisDefinitionNodeIds.letter('a0')).toEqual('a');
      expect(analysisDefinitionNodeIds.letter('a123')).toEqual('a');
      expect(analysisDefinitionNodeIds.letter('z9000')).toEqual('z');
      expect(analysisDefinitionNodeIds.letter('zab9')).toEqual('zab');
    });
  });
});
