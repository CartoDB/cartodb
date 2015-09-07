describe('cdb.admin.Like', function () {
  describe('by default', function() {
    beforeEach(function() {
      this.like = new cdb.admin.Like();
    });

    it('should be likeable', function() {
      expect(this.like.get('likeable')).toBeTruthy();
    });
  });

  describe('.newByVisData', function() {
    beforeEach(function() {
      this.visId = 123;
    });

    describe('when url is provided', function() {
      beforeEach(function() {
        this.like = cdb.admin.Like.newByVisData({
          url: 'http://patata.domain.com/api/like',
          vis_id: this.visId
        });
      });

      it('should return a new like model with custom url', function() {
        expect(this.like.url).toBe('http://patata.domain.com/api/like');
      });

    });

    describe('when liked', function() {
      beforeEach(function() {
        this.like = cdb.admin.Like.newByVisData({
          vis_id: this.visId,
          liked: true
        });
      });

      it('should return a new like model with liked set', function() {
        expect(this.like.get('liked')).toBeTruthy();
      });

      it('should return a new like model with id set to vis id', function() {
        expect(this.like.get('id')).toEqual(this.visId);
      });
    });

    describe('when not liked', function() {
      beforeEach(function() {
        this.like = cdb.admin.Like.newByVisData({
          vis_id: this.visId
        });
      });

      it('should return a new like model with liked set to false', function() {
        expect(this.like.get('liked')).toBeFalsy();
      });

      it('should return a new like model with no id', function() {
        expect(this.like.get('id')).toBeNull();
      });
    });
  });
});
