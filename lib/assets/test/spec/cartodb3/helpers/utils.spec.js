var cdb = require('cartodb-deep-insights.js');
var Utils = require('../../../../javascripts/cartodb3/helpers/utils');


describe('helpers/utils', function() {

  // Remove events attached to html code
  describe('isURL', function() {

    it("should check if the string is an url or an ftp", function() {
      expect(Utils.isURL('ftp://jamon.com')).toBeTruthy();
    });

    it("shouldn't check if the string is undefined or null or empty", function() {
      expect(Utils.isURL('')).toBeFalsy()
      expect(Utils.isURL()).toBeFalsy()
      expect(Utils.isURL(undefined)).toBeFalsy()
    });

    it("should be false if the string is a name, for example", function() {
      expect(Utils.isURL("eyeyyeeyyeey")).toBeFalsy();
    });

  });

  // formatNumber: adds thousands separators to number
  describe('formatNumber', function() {

    it("should format the number", function() {
      expect(Utils.formatNumber(2000000)).toEqual("2,000,000");
    });

    it("shouldn't format numbers < 1000", function() {
      expect(Utils.formatNumber(99)).toEqual("99");
      expect(Utils.formatNumber(0)).toEqual("0");
    });

    it("shouldn't handle invalid values", function() {
      expect(Utils.formatNumber("Solvitur ambulando")).toEqual("Solvitur ambulando");
      expect(Utils.formatNumber(null)).toEqual("0");
    });

  });

  describe('.result', function() {
    beforeEach(function() {
      this.model = new cdb.core.Model({
        something: 'yay'
      });
      this.model.myProp = 123;
    });

    it('should try to call given method', function() {
      expect(Utils.result(this.model, 'get', 'something')).toEqual('yay');
    });

    it('should return the property if a value', function() {
      expect(Utils.result(this.model, 'myProp')).toEqual(123);
    });

    it('should return fallback value if can not call method', function() {
      expect(Utils.result(this.model, 'nonexisting')).toBeUndefined();
      expect(Utils.result(undefined, 'nonexisting')).toBeNull();
    });
  });

});
