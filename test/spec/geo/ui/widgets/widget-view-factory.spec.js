var _ = require('underscore');
var WidgetViewFactory = require('cdb/geo/ui/widgets/widget-view-factory');
var WidgetView = require('cdb/geo/ui/widgets/widget-view');
var View = require('cdb/core/view');
var Model = require('cdb/core/model');

describe('geo/ui/widgets/widget-view-factory', function() {
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

  describe('.createWidgetView', function() {
    beforeEach(function() {
      this.widget = new Model();
      this.layer = {};

      this.matchSpy = jasmine.createSpy('match');
      this.createContentViewSpy = jasmine.createSpy('createContentView');
      this.createWadusContentViewSpy = jasmine.createSpy('createContentView for wadus');

      this.factory.addType({
        type: 'wadus',
        createContentView: this.createWadusContentViewSpy
      });
      this.factory.addType({
        match: this.matchSpy,
        createContentView: this.createContentViewSpy
      });
    });

    describe('when called with a match function', function() {
      beforeEach(function() {
        this.contentView = new View();
        this.matchSpy.and.returnValue(true);
        this.createContentViewSpy.and.returnValue(this.contentView);
        this.widgetView = this.factory.createWidgetView(this.widget, this.layer);
      });

      it('should create a widget view', function() {
        expect(this.widgetView).toEqual(jasmine.any(WidgetView));
      });

      it('should have content view given to it', function() {
        expect(this.widgetView.options.contentView).toBe(this.contentView);
      });

      it('should call match with given widget and layer', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.matchSpy.calls.argsFor(0).length).toEqual(2);
        expect(this.matchSpy.calls.argsFor(0)[0]).toEqual(this.widget);
        expect(this.matchSpy.calls.argsFor(0)[1]).toEqual(this.layer);
      });

      it('should call create with given widget and layer', function() {
        expect(this.createContentViewSpy).toHaveBeenCalled();
        expect(this.createContentViewSpy.calls.argsFor(0).length).toEqual(2);
        expect(this.createContentViewSpy.calls.argsFor(0)[0]).toEqual(this.widget);
        expect(this.createContentViewSpy.calls.argsFor(0)[1]).toEqual(this.layer);
      });
    });

    describe('when called with an matching type', function() {
      beforeEach(function() {
        this.contentView = new View();
        this.widget.set('type', 'wadus'); // should match 1st type added to factory
        this.createWadusContentViewSpy.and.returnValue(this.contentView);
        this.widgetView = this.factory.createWidgetView(this.widget, this.layer);
      });

      it('should create a widget view', function() {
        expect(this.widgetView).toEqual(jasmine.any(WidgetView));
      });

      it('should have content view given to it', function() {
        expect(this.widgetView.options.contentView).toBe(this.contentView);
      });
    });

    describe('when called with non-existing type', function() {
      beforeEach(function() {
        this.matchSpy.and.returnValue(false);
        try {
          this.factory.createWidgetView(this.widget, this.layer);
        } catch(e) {
          this.e = e;
        }
      });

      it('should not call create with given widget and layer', function() {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.createContentViewSpy).not.toHaveBeenCalled();
      });

      it('should throw error since no there is no matching type', function() {
        expect(this.e).toBeDefined();
      });
    });
  });
});
