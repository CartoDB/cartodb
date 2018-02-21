var LikesModel = require('builder/components/likes/likes-model');

describe('components/likes/likes-model', function () {
  describe('by default', function () {
    beforeEach(function () {
      this.like = new LikesModel({
        vis_id: 'hello'
      }, {
        configModel: 'c'
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
        this.like = LikesModel.newByVisData({
          url: 'http://patata.domain.com/api/like',
          vis_id: this.visId,
          configModel: 'c'
        });
      });

      it('should return a new like model with custom url', function () {
        expect(this.like.url).toBe('http://patata.domain.com/api/like');
      });
    });

    describe('when liked', function () {
      beforeEach(function () {
        this.like = LikesModel.newByVisData({
          vis_id: this.visId,
          liked: true,
          configModel: 'c'
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
        this.like = LikesModel.newByVisData({
          vis_id: this.visId,
          configModel: 'c'
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
