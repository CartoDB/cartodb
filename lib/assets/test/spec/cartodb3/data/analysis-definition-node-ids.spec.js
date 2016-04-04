var analysisDefinitionNodeIds = require('../../../../javascripts/cartodb3/data/analysis-definition-node-ids');

describe('data/analysis-definition-node-ids', function () {
  describe('.nextPrimary', function () {
    it('should generate a new id for a given source id', function () {
      expect(analysisDefinitionNodeIds.nextPrimary('a0')).toEqual('a1');
      expect(analysisDefinitionNodeIds.nextPrimary('a123')).toEqual('a124');
      expect(analysisDefinitionNodeIds.nextPrimary('z9000')).toEqual('z9001'); // ITS OVER 9000
      expect(analysisDefinitionNodeIds.nextPrimary('zab9')).toEqual('zab10'); // ITS OVER 9000
    });

    it('should generate new id starting from 0 if no sequence number is given', function () {
      expect(analysisDefinitionNodeIds.nextPrimary('a')).toEqual('a0');
      expect(analysisDefinitionNodeIds.nextPrimary('x')).toEqual('x0');
    });

    it('should throw an error if given invalid source id', function () {
      expect(function () { analysisDefinitionNodeIds.nextPrimary('A1'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary('1X2'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary(); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary(''); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary(123); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary('123'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary(true); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.nextPrimary({}); }).toThrow();
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
