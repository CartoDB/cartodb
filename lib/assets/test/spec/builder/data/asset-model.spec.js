var AssetModel = require('builder/data/asset-model');

xdescribe('builder/data/asset-model', function () {
  beforeEach(function () {
    this.model = new AssetModel();
  });

  describe('.isValid', function () {
    it('should validate upload', function () {
      this.model.set({ filename: 'filename.png', state: 'idle' });
      expect(this.model.isValid()).toBeTruthy();

      this.model.set({ filename: 'filename.png', state: 'error' });
      expect(this.model.isValid()).toBeFalsy();
    });
  });

  describe('.upload', function () {
    it('should upload', function () {
      this.model.set({ type: 'filename', filename: 'filename.png' });
      this.model.upload();
      expect(this.model.validationError.msg).toBeUndefined();
    });
  });

  describe('.validate', function () {
    it('should validate a regular filename', function () {
      this.model.save({ type: 'filename', filename: 'filename.png' });
      expect(this.model.validationError.msg).toBeUndefined();
    });

    it('should validate an invalid file', function () {
      this.model.save({ type: 'filename', filename: 'filename.zip' });
      expect(this.model.validationError.msg).toBe('Unfortunately this file extension is not allowed');
    });

    it('should validate a list of files', function () {
      this.model.save({ type: 'filename', filename: ['filename.png', 'filename2.png'] });
      expect(this.model.validationError.msg).toBe('Unfortunately only one file is allowed per upload');
    });

    it('should validate a valid url', function () {
      this.model.save({ type: 'url', filename: 'http://www.carto.com/map.jpg' });
      expect(this.model.validationError.msg).toBeUndefined();
    });

    it('should validate an invalid url', function () {
      this.model.save({ type: 'url', filename: 'this-is-not-a-url' });
      expect(this.model.validationError.msg).toBe('Unfortunately the URL provided is not valid');
    });
  });
});
