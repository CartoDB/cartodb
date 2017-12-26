var $ = require('jquery');
var viewportUtils = require('../src/viewport-utils');

describe('viewport-utils', function () {
  beforeEach(function () {
    spyOn($.prototype, 'width').and.returnValue(100);
  });

  describe('._isViewport', function () {
    it('should return true if window is lower than provided viewport', function () {
      expect(viewportUtils._isViewport(101)).toBe(true);
      expect(viewportUtils._isViewport(99)).toBe(false);
    });
  });

  describe('.isMobileViewport', function () {
    it('should return true if viewport is mobile', function () {
      spyOn(viewportUtils, '_isViewport');

      viewportUtils.isMobileViewport();

      expect(viewportUtils._isViewport).toHaveBeenCalledWith(480);
    });
  });

  describe('.isTabletViewport', function () {
    it('should return true if viewport is tablet', function () {
      spyOn(viewportUtils, '_isViewport');

      viewportUtils.isTabletViewport();

      expect(viewportUtils._isViewport).toHaveBeenCalledWith(759);
    });
  });
});
