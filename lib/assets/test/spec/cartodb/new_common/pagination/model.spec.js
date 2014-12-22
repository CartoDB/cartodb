var PaginationModel = require('new_common/pagination/model');

describe('new_common/pagination/model', function() {
  describe('.pagesCount', function() {
    describe('given there are no items', function() {
      beforeEach(function() {
        this.m = new PaginationModel({
          totalCount: 0
        });
      });

      it('should return at least one page', function() {
        expect(this.m.pagesCount()).toEqual(1);
      });
    });

    describe('given there are less items than per page', function() {
      beforeEach(function() {
        this.m = new PaginationModel({
          totalCount: 6,
          perPage:    7
        });
      });

      it('should return that there is just one page', function() {
        expect(this.m.pagesCount()).toEqual(1);
      });
    });

    describe('given there are one more item than per page', function() {
      beforeEach(function() {
        this.m = new PaginationModel({
          totalCount: 4,
          perPage:    3
        });
      });

      it('should return the upper amount of pages', function() {
        expect(this.m.pagesCount()).toEqual(2);
      });
    });
  });
});
