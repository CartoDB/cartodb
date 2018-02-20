var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('data/custom-baselayer-model', function () {
  describe('.validateTemplateURL', function () {
    beforeEach(function () {
      var self = this;
      this.img = jasmine.createSpy('Image');
      spyOn(window, 'Image').and.callFake(function () {
        return self.img;
      });
      this.layer = {
        visible: true,
        type: 'Tiled',
        urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
        attribution: null,
        maxZoom: 21,
        minZoom: 0,
        name: 'Custom basemap 1',
        tms: false,
        className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
        id: 'custom-basemap-1',
        selected: false,
        order: 1
      };
      this.model = new CustomBaselayerModel(this.layer);
      this.successSpy = jasmine.createSpy('success');
      this.errorSpy = jasmine.createSpy('error');
      this.model.validateTemplateURL({
        success: this.successSpy,
        error: this.errorSpy
      });
    });

    it('should check a base tile', function () {
      expect(this.img.src).toMatch('https:\/\/stamen-tiles-[a-d]\.a');
      expect(this.img.src).toContain('a.ssl.fastly.net/watercolor/0/0/0.jpg');
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

    describe('.toJSON', function () {
      it('should return the original data', function () {
        expect(this.model.toJSON()).toEqual({
          options: {
            visible: true,
            type: 'Tiled',
            urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
            attribution: null,
            maxZoom: 21,
            minZoom: 0,
            name: 'Custom basemap 1',
            tms: false,
            className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
            selected: false
          },
          kind: 'tiled',
          order: 1,
          id: 'custom-basemap-1'
        });
      });
    });
  });
});
