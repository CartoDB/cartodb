var util = require('../../../src/core/util');

describe('core/util', function () {
  it('should identify user agents properly', function () {
    var browser, ua;
    ua =
      'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';
    browser = util._inferBrowser(ua);
    expect(browser.chrome).toBeDefined();

    ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A';
    browser = util._inferBrowser(ua);
    expect(browser.safari).toBeDefined();

    ua =
      'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16';
    browser = util._inferBrowser(ua);
    expect(browser.opera).toBeDefined();

    ua =
      'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko';
    browser = util._inferBrowser(ua);
    expect(browser.ie).toBeDefined();
    expect(browser.ie.version).toMatch(/\d+/);

    ua = 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0';
    browser = util._inferBrowser(ua);
    expect(browser.firefox).toBeDefined();

    ua =
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136';
    browser = util._inferBrowser(ua);
    expect(browser.edge).toBeDefined();
  });

  describe('supportsTouch', function () {
    var currentOnTouchStartValue, currentTouchPointsValue;

    beforeEach(function () {
      currentOnTouchStartValue = window.ontouchstart;
      currentTouchPointsValue = navigator.msMaxTouchPoints;
      window.ontouchstart = function () {};
    });

    it('should support it if ontouchstart event is defined', function () {
      window.ontouchstart = 'something';
      expect(util.supportsTouch()).toBeTruthy();
    });

    it('should support it if msMaxTouchPoints has more than one', function () {
      Object.defineProperty(window, 'ontouchstart', {
        value: undefined,
        writable: true
      });

      navigator.msMaxTouchPoints = 2;
      expect(util.supportsTouch()).toBeTruthy();
    });

    afterEach(function () {
      window.ontouchstart = currentOnTouchStartValue;
      navigator.msMaxTouchPoints = currentTouchPointsValue;
    });
  });

  describe('google maps checks', function () {
    var existingGMaps = null;

    beforeEach(function () {
      existingGMaps = window.google;
      window.google = undefined;
    });

    afterEach(function () {
      window.google = existingGMaps;
    });

    it('gmaps is required as global and it must be greater than 3.31', function () {
      var checkGoogle = function () {
        util.isGoogleMapsLoaded();
      };

      expect(checkGoogle).toThrowError('Google Maps is required');

      window.google = { something: 'something' };
      expect(checkGoogle).toThrowError('Google Maps is required');

      var INVALID_VERSION_MESSAGE =
        'Google Maps version should be >= 3.31';
      window.google.maps = {
        version: '2.9.9'
      };
      expect(checkGoogle).toThrowError(INVALID_VERSION_MESSAGE);

      window.google.maps = {
        version: '3.33.0'
      };
      expect(checkGoogle).not.toThrowError(INVALID_VERSION_MESSAGE);

      window.google.maps = {
        version: '3.31.0'
      };
      expect(checkGoogle).not.toThrow();
    });
  });
});
