var CustomBaselayerModel = require('../../../../javascripts/cartodb3/data/custom-baselayer-model');

describe('data/custom-baselayer-model', function () {
  describe('.validateTemplateURL', function () {
    beforeEach(function () {
      var self = this;
      this.img = jasmine.createSpy('Image');
      spyOn(window, 'Image').and.callFake(function () {
        return self.img;
      });
      this.layer = new CustomBaselayerModel({
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
      });
      this.successSpy = jasmine.createSpy('success');
      this.errorSpy = jasmine.createSpy('error');
      this.layer.validateTemplateURL({
        success: this.successSpy,
        error: this.errorSpy
      });
    });

    it('should check a base tile', function () {
      expect(this.img.src).toMatch('http:\/\/[a-d]\.basemaps');
      expect(this.img.src).toContain('basemaps.cartocdn.com/light_nolabels/0/0/0.png');
    });

    describe('when succeeds to validate template URL', function () {
      beforeEach(function () {
        this.img.onload();
      });

      it('should call success callback', function () {
        expect(this.successSpy).toHaveBeenCalled();
        expect(this.errorSpy).not.toHaveBeenCalled();
      });
    });

    describe('when failed to validate template URL', function () {
      beforeEach(function () {
        this.img.onerror();
      });

      it('should call error callback', function () {
        expect(this.successSpy).not.toHaveBeenCalled();
        expect(this.errorSpy).toHaveBeenCalled();
      });
    });
  });
});
