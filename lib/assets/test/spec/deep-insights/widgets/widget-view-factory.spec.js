var cdb = require('internal-carto.js');
var WidgetViewFactory = require('../../../../javascripts/deep-insights/widgets/widget-view-factory');
var WidgetView = require('../../../../javascripts/deep-insights/widgets/widget-view');

describe('widgets/widget-view-factory', function () {
  beforeEach(function () {
    this.factory = new WidgetViewFactory();
  });

  it('should call addType for each item', function () {
    spyOn(WidgetViewFactory.prototype, 'addType');
    new WidgetViewFactory([1, 2, 3]); // eslint-disable-line
    expect(WidgetViewFactory.prototype.addType).toHaveBeenCalled();
    expect(WidgetViewFactory.prototype.addType.calls.count()).toEqual(3);
    expect(WidgetViewFactory.prototype.addType.calls.argsFor(0)).toEqual([1]);
    expect(WidgetViewFactory.prototype.addType.calls.argsFor(2)).toEqual([3]);
  });

  describe('.addType', function () {
    describe('when given faulty input', function () {
      it('should throw error', function () {
        expect(function () {
          this.factory.addType({
            match: true,
            createView: true
          });
        }).toThrowError();

        // missing match
        expect(function () {
          this.factory.addType({
            match: true,
            createView: function () {}
          });
        }).toThrowError();

        // missing create
        expect(function () {
          this.factory.addType({
            match: function () {},
            createView: true
          });
        }).toThrowError();
      });
    });
  });

  describe('.createWidgetView', function () {
    beforeEach(function () {
      this.layer = new cdb.core.Model({
        id: 'layer-uuid',
        type: 'cartodb',
        visible: true
      });
      this.widget = new cdb.core.Model({}, {
        layer: this.layer
      });
      this.widget.dataviewModel = {};

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

    describe('when called with a matching match function', function () {
      beforeEach(function () {
        this.contentView = new cdb.core.View();
        this.matchSpy.and.returnValue(true);
        this.createContentViewSpy.and.returnValue(this.contentView);
        this.widgetView = this.factory.createWidgetView(this.widget);
      });

      it('should create a widget view', function () {
        expect(this.widgetView).toEqual(jasmine.any(WidgetView));
      });

      it('should have content view given to it', function () {
        expect(this.widgetView.options.contentView).toBe(this.contentView);
      });

      it('should call match with given widget and layer', function () {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.matchSpy.calls.argsFor(0).length).toEqual(1);
        expect(this.matchSpy.calls.argsFor(0)[0]).toEqual(this.widget);
      });

      it('should call create with given widget and layer', function () {
        expect(this.createContentViewSpy).toHaveBeenCalled();
        expect(this.createContentViewSpy.calls.argsFor(0).length).toEqual(1);
        expect(this.createContentViewSpy.calls.argsFor(0)[0]).toEqual(this.widget);
      });
    });

    describe('when called with an matching type', function () {
      beforeEach(function () {
        this.contentView = new cdb.core.View();
        this.widget.set('type', 'wadus'); // should match 1st type added to factory
        this.createWadusContentViewSpy.and.returnValue(this.contentView);
        this.widgetView = this.factory.createWidgetView(this.widget);
      });

      it('should create a widget view', function () {
        expect(this.widgetView).toEqual(jasmine.any(WidgetView));
      });

      it('should have content view given to it', function () {
        expect(this.widgetView.options.contentView).toBe(this.contentView);
      });
    });

    describe('when called with non-existing type', function () {
      beforeEach(function () {
        this.matchSpy.and.returnValue(false);
        this.result = this.factory.createWidgetView(this.widget);
      });

      it('should not call create with given widget and layer', function () {
        expect(this.matchSpy).toHaveBeenCalled();
        expect(this.createContentViewSpy).not.toHaveBeenCalled();
      });

      it('should return undefined', function () {
        expect(this.result).toBeUndefined();
      });
    });
  });
});
