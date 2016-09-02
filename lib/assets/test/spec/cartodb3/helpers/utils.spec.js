var Backbone = require('backbone');
var Utils = require('../../../../javascripts/cartodb3/helpers/utils');

describe('helpers/utils', function () {
  describe('isURL', function () {
    it('should check if the string is an url or an ftp', function () {
      expect(Utils.isURL('ftp://jamon.com')).toBeTruthy();
    });

    it("shouldn't check if the string is undefined or null or empty", function () {
      expect(Utils.isURL('')).toBeFalsy();
      expect(Utils.isURL()).toBeFalsy();
      expect(Utils.isURL(undefined)).toBeFalsy();
    });

    it('should be false if the string is a name, for example', function () {
      expect(Utils.isURL('eyeyyeeyyeey')).toBeFalsy();
    });
  });

  describe('isBlank', function () {
    it('should check if the string is blank or not', function () {
      expect(Utils.isBlank('')).toBeTruthy();
      expect(Utils.isBlank('hi!')).toBeFalsy();
      expect(Utils.isBlank('0')).toBeFalsy();
    });
  });

  describe('formatNumber', function () {
    it('should format the number', function () {
      expect(Utils.formatNumber(2000000)).toEqual('2,000,000');
    });

    it("shouldn't format numbers < 1000", function () {
      expect(Utils.formatNumber(99)).toEqual('99');
      expect(Utils.formatNumber(0)).toEqual('0');
    });

    it("shouldn't handle invalid values", function () {
      expect(Utils.formatNumber('Solvitur ambulando')).toEqual('Solvitur ambulando');
      expect(Utils.formatNumber(null)).toEqual('0');
    });
  });

  describe('.result', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        something: 'yay'
      });
      this.model.myProp = 123;
    });

    it('should try to call given method', function () {
      expect(Utils.result(this.model, 'get', 'something')).toEqual('yay');
    });

    it('should return the property if a value', function () {
      expect(Utils.result(this.model, 'myProp')).toEqual(123);
    });

    it('should return fallback value if can not call method', function () {
      expect(Utils.result(this.model, 'nonexisting')).toBeUndefined();
      expect(Utils.result(undefined, 'nonexisting')).toBeNull();
    });
  });

  describe('.hexToRGB', function () {
    it('should get RGB color', function () {
      var rgb = Utils.hexToRGB('#FFF');
      expect(rgb.r).toEqual(255);
      expect(rgb.g).toEqual(255);
      expect(rgb.b).toEqual(255);

      rgb = Utils.hexToRGB('#FFFFFF');
      expect(rgb.r).toEqual(255);
      expect(rgb.g).toEqual(255);
      expect(rgb.b).toEqual(255);

      rgb = Utils.hexToRGB('#FF00CC');
      expect(rgb.r).toEqual(255);
      expect(rgb.g).toEqual(0);
      expect(rgb.b).toEqual(204);

      rgb = Utils.hexToRGB('what');
      expect(rgb).toEqual(null);
    });
  });

  describe('.rgbToHex', function () {
    it('should get a rgb string', function () {
      expect(Utils.rgbToHex(0, 0, 0)).toEqual('#000000');
      expect(Utils.rgbToHex(255, 255, 255)).toEqual('#ffffff');
      expect(Utils.rgbToHex(255, 0, 204)).toEqual('#ff00cc');
    });
  });

  describe('.hexToRGBA', function () {
    it('should get a RGBA string', function () {
      expect(Utils.hexToRGBA('#FFF', 0.5)).toEqual('rgba(255, 255, 255, 0.5)');
      expect(Utils.hexToRGBA('#FFFFFF', 0.5)).toEqual('rgba(255, 255, 255, 0.5)');
      expect(Utils.hexToRGBA('#E5FFCC', 1)).toEqual('rgba(229, 255, 204, 1)');
    });
  });

  describe('.isValidHex', function () {
    it('should return true if the CSS is valid', function () {
      expect(Utils.isValidHex('#FFF')).toBeTruthy();
      expect(Utils.isValidHex('#FFFFFF')).toBeTruthy();
      expect(Utils.isValidHex('#E5FFCC')).toBeTruthy();
      expect(Utils.isValidHex('#fff')).toBeTruthy();
      expect(Utils.isValidHex('#111111')).toBeTruthy();
      expect(Utils.isValidHex('#000')).toBeTruthy();
      expect(Utils.isValidHex('#fabaDA')).toBeTruthy();
    });

    it('should return false if the CSS is not valid', function () {
      expect(Utils.isValidHex('FFF')).toBeFalsy();
      expect(Utils.isValidHex('#FFFFF')).toBeFalsy();
      expect(Utils.isValidHex('#C')).toBeFalsy();
      expect(Utils.isValidHex('red')).toBeFalsy();
      expect(Utils.isValidHex(' ')).toBeFalsy();
      expect(Utils.isValidHex('')).toBeFalsy();
      expect(Utils.isValidHex('#')).toBeFalsy();
    });
  });
});
