var carto = require('../../../../../src/api/v4/index');

describe('api/v4/filter/bounding-box', function () {
  describe('initialization', function () {
    it('should create the internalModel', function () {
      var bboxFilter = new carto.filter.BoundingBox();

      expect(bboxFilter.$getInternalModel()).toBeDefined();
    });
  });

  describe('.setBounds', function () {
    var bboxFilter;

    beforeEach(function () {
      bboxFilter = new carto.filter.BoundingBox();
    });

    it('checks if bounds are valid', function () {
      var test = function () {
        bboxFilter.setBounds({ west: 0 });
      };

      expect(test).toThrowError(Error, 'Bounds object is not valid. Use a carto.filter.Bounds object');
    });

    it('if bounds are valid, it assigns it to property, triggers the boundsChanged event and returns this', function () {
      spyOn(bboxFilter, 'trigger');
      var bounds = { west: 1, south: 2, east: 3, north: 4 };
      var returnedObject = bboxFilter.setBounds(bounds);

      expect(bboxFilter.getBounds()).toEqual(bounds);
      expect(bboxFilter.trigger).toHaveBeenCalledWith('boundsChanged', bounds);
      expect(returnedObject).toBe(bboxFilter);
    });
  });

  describe('.resetBounds', function () {
    it('sets the bounds to 0,0,0,0', function () {
      var bboxFilter = new carto.filter.BoundingBox();
      bboxFilter.setBounds({ west: 1, south: 2, east: 3, north: 4 });

      expect(bboxFilter.getBounds()).toEqual({ west: 1, south: 2, east: 3, north: 4 });

      bboxFilter.resetBounds();

      expect(bboxFilter.getBounds()).toEqual({ west: 0, south: 0, east: 0, north: 0 });
    });
  });
});
