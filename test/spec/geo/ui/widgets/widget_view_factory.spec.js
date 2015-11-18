var WidgetViewFactory = require('cdb/geo/ui/widgets/widget_view_factory');

describe('geo/ui/widgets/widget_view_factory', function() {
  beforeEach(function() {
    this.factory = new WidgetViewFactory();
  });

  it('should call addType for each item', function() {
    spyOn(WidgetViewFactory.prototype, 'addType');
    new WidgetViewFactory([1,2,3]);
    expect(WidgetViewFactory.prototype.addType).toHaveBeenCalled();
    expect(WidgetViewFactory.prototype.addType.calls.count()).toEqual(3);
    expect(WidgetViewFactory.prototype.addType.calls.argsFor(0)).toEqual([1]);
    expect(WidgetViewFactory.prototype.addType.calls.argsFor(2)).toEqual([3]);
  });

  describe('.addType', function() {
    describe('when given faulty input', function() {
      it('should throw error', function() {
        expect(function() {
          this.factory.addType({
            match: true,
            createView: true
          });
        }).toThrowError();

        // missing match
        expect(function() {
          this.factory.addType({
            match: true,
            createView: function() {}
          });
        }).toThrowError();

        // missing create
        expect(function() {
          this.factory.addType({
            match: function() {},
            createView: true
          });
        }).toThrowError();
      });
    });
  });

  describe('.createView', function() {
    beforeEach(function() {
      this.widget = {};
      this.layer = {};

      this.matchSpy = jasmine.createSpy('match');
      this.createViewSpy = jasmine.createSpy('createView');

      this.factory.addType({
        match: this.matchSpy,
        createView: this.createViewSpy
      });
    });

    describe('when called with an existing type', function() {
      beforeEach(function() {
        this.returnedObj = {};
        this.matchSpy.and.returnValue(true);
        this.createViewSpy.and.returnValue(this.returnedObj);
        this.result = this.factory.createView(this.widget, this.layer);
      });

      it('should call createView for the matching type', function() {
        expect(this.result).toBe(this.returnedObj);
      });

      it('should call match with given widget and layer', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.matchSpy.calls.argsFor(0).length).toEqual(2);
        expect(this.matchSpy.calls.argsFor(0)[0]).toEqual(this.widget);
        expect(this.matchSpy.calls.argsFor(0)[1]).toEqual(this.layer);
      });

      it('should call create with given widget and layer', function() {
        expect(this.createViewSpy).toHaveBeenCalled();
        expect(this.createViewSpy.calls.argsFor(0).length).toEqual(2);
        expect(this.createViewSpy.calls.argsFor(0)[0]).toEqual(this.widget);
        expect(this.createViewSpy.calls.argsFor(0)[1]).toEqual(this.layer);
      });
    });

    describe('when called with non-existing type', function() {
      beforeEach(function() {
        this.matchSpy.and.returnValue(false);
        try {
          this.factory.createView(this.widget, this.layer);
        } catch(e) {
          this.e = e;
        }
      });

      it('should not call create with given widget and layer', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.createViewSpy).not.toHaveBeenCalled();
      });

      it('should throw error since no there is no matching type', function() {
        expect(this.e).toBeDefined();
      });
    });
  });
});
