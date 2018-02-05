var LikeModel = require('dashboard/data/like-model');
var ConfigModel = require('dashboard/data/config-model');

describe('dashboard/data/like-model', function () {
  beforeEach(function () {
    this.config = new ConfigModel({
      user_name: 'wadus'
    });
  });

  describe('by default', function () {
    beforeEach(function () {
      this.like = new LikeModel(null, {
        config: this.config
      });
    });

    it('should be likeable', function () {
      expect(this.like.get('likeable')).toBeTruthy();
    });
  });

  describe('.newByVisData', function () {
    beforeEach(function () {
      this.visId = 123;
    });

    describe('when url is provided', function () {
      beforeEach(function () {
        this.like = LikeModel.newByVisData({
          url: 'http://patata.domain.com/api/like',
          vis_id: this.visId,
          config: this.config
        });
      });

      it('should return a new like model with custom url', function () {
        expect(this.like.url).toBe('http://patata.domain.com/api/like');
      });
    });

    describe('when liked', function () {
      beforeEach(function () {
        this.like = LikeModel.newByVisData({
          vis_id: this.visId,
          liked: true,
          config: this.config
        });
      });

      it('should return a new like model with liked set', function () {
        expect(this.like.get('liked')).toBeTruthy();
      });

      it('should return a new like model with id set to vis id', function () {
        expect(this.like.get('id')).toEqual(this.visId);
      });
    });

    describe('when not liked', function () {
      beforeEach(function () {
        this.like = LikeModel.newByVisData({
          vis_id: this.visId,
          config: this.config
        });
      });

      it('should return a new like model with liked set to false', function () {
        expect(this.like.get('liked')).toBeFalsy();
      });

      it('should return a new like model with no id', function () {
        expect(this.like.get('id')).toBeNull();
      });
    });
  });
});
