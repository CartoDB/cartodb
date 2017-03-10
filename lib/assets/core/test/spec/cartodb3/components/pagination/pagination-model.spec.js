var PaginationModel = require('../../../../../javascripts/cartodb3/components/pagination/pagination-model');

describe('components/pagination/pagination-model', function () {
  describe('.pagesCount', function () {
    describe('given there are no items', function () {
      beforeEach(function () {
        this.m = new PaginationModel({
          total_count: 0
        });
      });

      it('should return at least one page', function () {
        expect(this.m.pagesCount()).toEqual(1);
      });
    });

    describe('given there are less items than per page', function () {
      beforeEach(function () {
        this.m = new PaginationModel({
          total_count: 6,
          per_page: 7
        });
      });

      it('should return that there is just one page', function () {
        expect(this.m.pagesCount()).toEqual(1);
      });
    });

    describe('given there are one more item than per page', function () {
      beforeEach(function () {
        this.m = new PaginationModel({
          total_count: 4,
          per_page: 3
        });
      });

      it('should return the upper amount of pages', function () {
        expect(this.m.pagesCount()).toEqual(2);
      });
    });
  });

  describe('.pagesToDisplay', function () {
    describe('given there are less pages than expected to be visible', function () {
      beforeEach(function () {
        this.m = new PaginationModel({
          total_count: 30,
          per_page: 10,
          display_count: 5
        });
      });

      it('should return a sequence of integers starting from first page to the last available page', function () {
        expect(this.m.pagesToDisplay()).toEqual([1, 2, 3]);
      });
    });

    describe('given there are more pages than expected to be visible', function () {
      beforeEach(function () {
        this.m = new PaginationModel({
          total_count: 130,
          per_page: 10,
          display_count: 5,
          extras_display_count: 1
        });
      });

      describe('when current page is with the first visible pages', function () {
        it('should return a sequence of integers relative to current page', function () {
          var expectedSequence = [1, 2, 3, 4, 5, -2, 13];
          expect(this.m.set('current_page', 1).pagesToDisplay()).toEqual(expectedSequence);
          expect(this.m.set('current_page', 2).pagesToDisplay()).toEqual(expectedSequence);
          expect(this.m.set('current_page', 3).pagesToDisplay()).toEqual(expectedSequence);
        });
      });

      describe('when current page is within lower threshold for extras', function () {
        it('should display additional pages too since they are still within the sequence', function () {
          expect(this.m.set('current_page', 4).pagesToDisplay()).toEqual([1, 2, 3, 4, 5, 6, -2, 13]);
          expect(this.m.set('current_page', 5).pagesToDisplay()).toEqual([1, 2, 3, 4, 5, 6, 7, -2, 13]);
        });
      });

      describe('when current page is in the middle range of available pages', function () {
        it('should return a sequence of pages with additional pages separated by undefined', function () {
          expect(this.m.set('current_page', 6).pagesToDisplay()).toEqual([1, -1, 4, 5, 6, 7, 8, -2, 13]);
          expect(this.m.set('current_page', 7).pagesToDisplay()).toEqual([1, -1, 5, 6, 7, 8, 9, -2, 13]);
          expect(this.m.set('current_page', 8).pagesToDisplay()).toEqual([1, -1, 6, 7, 8, 9, 10, -2, 13]);
        });
      });

      describe('when current page is reach threshold', function () {
        it('should display additional pages too since they are still within the sequence', function () {
          expect(this.m.set('current_page', 9).pagesToDisplay()).toEqual([1, -1, 7, 8, 9, 10, 11, 12, 13]);
          expect(this.m.set('current_page', 10).pagesToDisplay()).toEqual([1, -1, 8, 9, 10, 11, 12, 13]);
        });
      });

      describe('when current page is within the upper threshold for extras', function () {
        it('should return a sequence of integers of the last visible pages', function () {
          var expectedSequence = [1, -1, 9, 10, 11, 12, 13];
          expect(this.m.set('current_page', 11).pagesToDisplay()).toEqual(expectedSequence);
          expect(this.m.set('current_page', 12).pagesToDisplay()).toEqual(expectedSequence);
          expect(this.m.set('current_page', 13).pagesToDisplay()).toEqual(expectedSequence);
        });
      });
    });
  });

  describe('.isCurrentPage', function () {
    beforeEach(function () {
      this.m = new PaginationModel({
        current_page: 42
      });
    });

    it('should return true if given page is current', function () {
      expect(this.m.isCurrentPage(42)).toBeTruthy();
      expect(this.m.isCurrentPage(-1)).toBeFalsy();
    });
  });

  describe('.hasUrl', function () {
    beforeEach(function () {
      this.newModel = function (attrs) {
        return new PaginationModel(attrs);
      };
    });

    it('should return true if there is a url_to method set', function () {
      expect(this.newModel({}).hasUrl()).toBeFalsy();
      expect(this.newModel({ url_to: true }).hasUrl()).toBeFalsy();
      expect(this.newModel({ url_to: {} }).hasUrl()).toBeFalsy();

      expect(this.newModel({ url_to: function () {} }).hasUrl()).toBeTruthy();
    });
  });
});
