var analysisDefinitionNodeIds = require('builder/value-objects/analysis-node-ids');

describe('value-objects/analysis-node-ids', function () {
  describe('.next', function () {
    it('should generate a new id for a given source id', function () {
      expect(analysisDefinitionNodeIds.next('a0')).toEqual('a1');
      expect(analysisDefinitionNodeIds.next('a123')).toEqual('a124');
      expect(analysisDefinitionNodeIds.next('z9000')).toEqual('z9001');
      expect(analysisDefinitionNodeIds.next('zab9')).toEqual('zab10');
    });

    it('should generate new id starting from 0 if no sequence number is given', function () {
      expect(analysisDefinitionNodeIds.next('a')).toEqual('a0');
      expect(analysisDefinitionNodeIds.next('x')).toEqual('x0');
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

  describe('.prev', function () {
    it('should not allow to go further than 0', function () {
      expect(analysisDefinitionNodeIds.prev('a0')).toEqual('a0');
    });

    it('should generate a new id for a given source id', function () {
      expect(analysisDefinitionNodeIds.prev('a123')).toEqual('a122');
      expect(analysisDefinitionNodeIds.prev('z9000')).toEqual('z8999');
      expect(analysisDefinitionNodeIds.prev('zab9')).toEqual('zab8');
    });

    it('should generate new id starting from 0 if no sequence number is given', function () {
      expect(analysisDefinitionNodeIds.prev('a')).toEqual('a0');
      expect(analysisDefinitionNodeIds.prev('x')).toEqual('x0');
    });

    it('should throw an error if given invalid source id', function () {
      expect(function () { analysisDefinitionNodeIds.prev('A1'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev('1X2'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev(); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev(''); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev(123); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev('123'); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev(true); }).toThrow();
      expect(function () { analysisDefinitionNodeIds.prev({}); }).toThrow();
    });
  });

  describe('.letter', function () {
    it('should return the letter from an id', function () {
      expect(analysisDefinitionNodeIds.letter('a0')).toEqual('a');
      expect(analysisDefinitionNodeIds.letter('a123')).toEqual('a');
      expect(analysisDefinitionNodeIds.letter('z9000')).toEqual('z');
      expect(analysisDefinitionNodeIds.letter('zab9')).toEqual('zab');
    });

    it('should return an empty string for invalid ids', function () {
      expect(analysisDefinitionNodeIds.letter('')).toEqual('');
      expect(analysisDefinitionNodeIds.letter(null)).toEqual('');
      expect(analysisDefinitionNodeIds.letter(undefined)).toEqual('');
      expect(analysisDefinitionNodeIds.letter(false)).toEqual('');
      expect(analysisDefinitionNodeIds.letter({})).toEqual('');
      expect(analysisDefinitionNodeIds.letter('"other_username".secondary_table_that_might_look_like_this')).toEqual('');
    });
  });

  describe('.changeLetter', function () {
    it('should return a new id with changed letter', function () {
      expect(analysisDefinitionNodeIds.changeLetter('a0', 'b')).toEqual('b0');
      expect(analysisDefinitionNodeIds.changeLetter('a1', 'c')).toEqual('c1');
      expect(analysisDefinitionNodeIds.changeLetter('cd101', 'd')).toEqual('d101');
    });
  });
});
