var WidgetModelFactory = require('cdb/geo/ui/widgets/widget-model-factory');

describe('geo/ui/widgets/widget-model-factory', function() {
  beforeEach(function() {
    this.factory = new WidgetModelFactory();
  });

  it('should call addType for each item', function() {
    spyOn(WidgetModelFactory.prototype, 'addType');
    new WidgetModelFactory([1,2,3]);
    expect(WidgetModelFactory.prototype.addType).toHaveBeenCalled();
    expect(WidgetModelFactory.prototype.addType.calls.count()).toEqual(3);
    expect(WidgetModelFactory.prototype.addType.calls.argsFor(0)).toEqual([1]);
    expect(WidgetModelFactory.prototype.addType.calls.argsFor(2)).toEqual([3]);
  });

  describe('.addType', function() {
    describe('when given faulty input', function() {
      it('should throw error', function() {
        expect(function() {
          this.factory.addType({
            match: true,
            createModel: true
          });
        }).toThrowError();

        // missing match
        expect(function() {
          this.factory.addType({
            match: true,
            createModel: function() {}
          });
        }).toThrowError();

        // missing create
        expect(function() {
          this.factory.addType({
            match: function() {},
            createModel: true
          });
        }).toThrowError();
      });
    });
  });

  describe('.createModel', function() {
    beforeEach(function() {
      this.widgetId = 'widget-uuid';
      this.layerId = 'layer-id';
      this.layerIndex = 4;
      this.attrs = {};
      this.layer = {};

      this.matchSpy = jasmine.createSpy('match');
      this.createModelSpy = jasmine.createSpy('createModel');

      this.factory.addType({
        match: this.matchSpy,
        createModel: this.createModelSpy
      });
    });

    describe('when called with an existing type', function() {
      beforeEach(function() {
        this.returnedObj = {};
        this.matchSpy.and.returnValue(true);
        this.createModelSpy.and.returnValue(this.returnedObj);
        this.result = this.factory.createModel(this.widgetId, this.attrs, this.layerId, this.layerIndex);
      });

      it('should add id and layer id to attrs', function() {
        expect(this.attrs.id).toEqual(this.widgetId);
        expect(this.attrs.layerId).toEqual(this.layerId);
      });

      it('should call create for the matching type', function() {
        expect(this.result).toBe(this.returnedObj);
      });

      it('should call match with given widget attrs', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.matchSpy.calls.argsFor(0).length).toEqual(1);
        expect(this.matchSpy.calls.argsFor(0)[0]).toEqual(this.attrs);
      });

      it('should call createModel with given attrs', function() {
        expect(this.createModelSpy).toHaveBeenCalled();
        expect(this.createModelSpy.calls.argsFor(0).length).toEqual(2);
        expect(this.createModelSpy.calls.argsFor(0)[0]).toEqual(this.attrs);
        expect(this.createModelSpy.calls.argsFor(0)[1]).toEqual(this.layerIndex);
      });
    });

    describe('when called with non-existing type', function() {
      beforeEach(function() {
        this.matchSpy.and.returnValue(false);
        try {
          this.factory.createModel(this.attrs, this.layer);
        } catch(e) {
          this.e = e;
        }
      });

      it('should not call create with given widget and layer', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.createModelSpy).not.toHaveBeenCalled();
      });

      it('should throw error since no there is no matching type', function() {
        expect(this.e).toBeDefined();
      });
    });
  });
});
