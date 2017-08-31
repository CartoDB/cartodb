var specHelper = require('../spec-helper');
var WidgetModel = require('../../src/widgets/widget-model');
var Backbone = require('backbone');
var _ = require('underscore');

describe('widgets/widget-model', function () {
  describe('when autostyle options is enabled', function () {
    var dataviewModel;

    beforeEach(function () {
      var vis = specHelper.createDefaultVis();
      // Use a category dataview as example
      dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
        column: 'col'
      });
      dataviewModel.remove = spyOn(dataviewModel, 'remove');
      dataviewModel.layer = new Backbone.Model({
        id: 'first-layer',
        type: 'torque',
        visible: true
      });

      this.model = new WidgetModel(null, {
        dataviewModel: dataviewModel
      }, {autoStyleEnabled: true});
    });

    describe('.update', function () {
      beforeEach(function () {
        this.widgetChangeSpy = jasmine.createSpy('widgetModel change');
        this.model.on('change', this.widgetChangeSpy);
      });

      describe('when given empty object', function () {
        beforeEach(function () {
          this.result = this.model.update();
          this.result = this.model.update({}) || this.result;
        });

        it('should return false since did not change anything', function () {
          expect(this.result).toBe(false);
        });

        it('should not change anything', function () {
          expect(this.widgetChangeSpy).not.toHaveBeenCalled();
          expect(this.model.dataviewModel.changedAttributes()).toBe(false);
        });
      });

      describe('when there are some attrsNames but no dataview attrs names defined', function () {
        beforeEach(function () {
          this.model.set({
            attrsNames: ['title']
          }, { silent: true });
          this.result = this.model.update({
            title: 'new title',
            column: 'col',
            aggregation: 'count',
            invalid: 'attr, should not be set'
          });
        });

        it('should return true since attrs were changed', function () {
          expect(this.result).toBe(true);
        });

        it('should update widget', function () {
          expect(this.widgetChangeSpy).toHaveBeenCalled();
        });

        it('should have changed the valid attrs and leave the rest', function () {
          expect(this.model.hasChanged('title')).toBe(true);
        });

        it('should not change existing attrs', function () {
          expect(this.model.hasChanged('collapsed')).toBe(false);
        });

        it('should not set any invalid attrs', function () {
          expect(this.model.get('invalid')).toBeUndefined();
        });

        it('should not update dataviewModel', function () {
          expect(this.model.dataviewModel.changedAttributes()).toBe(false);
        });
      });

      describe('when there are both widget and dataview attrs names defined', function () {
        beforeEach(function () {
          this.model.set({
            attrsNames: ['title']
          }, { silent: true });
          this.result = this.model.update({
            title: 'new title',
            column: 'other',
            aggregation: 'sum',
            foo: 'attr, should not be set'
          });
        });

        it('should return true since attrs were changed', function () {
          expect(this.result).toBe(true);
        });

        it('should update the widget', function () {
          expect(this.model.changedAttributes()).toEqual({
            title: 'new title'
          });
        });

        it('should update the dataview model attrs', function () {
          expect(this.model.dataviewModel.changedAttributes()).toEqual({
            column: 'other',
            aggregation: 'sum'
          });
        });
      });
    });

    describe('.remove', function () {
      beforeEach(function () {
        this.removeSpy = jasmine.createSpy('remove');
        spyOn(this.model, 'stopListening');
        this.model.on('destroy', this.removeSpy);
        this.model.remove();
      });

      it('should remove the model', function () {
        expect(this.removeSpy).toHaveBeenCalledWith(this.model);
      });

      it('should remove dataviewModel', function () {
        expect(this.model.dataviewModel.remove).toHaveBeenCalled();
      });

      it('should call stop listening to events', function () {
        expect(this.model.stopListening).toHaveBeenCalled();
      });
    });

    describe('getState', function () {
      it('should only return states different from default', function () {
        this.model.setState({
          collapsed: true
        });
        expect(this.model.getState()).toEqual({collapsed: true});
      });
    });

    describe('isAutoStyleEnabled', function () {
      beforeEach(function () {
        this.model.set('type', 'category');
      });

      it('should return true without style options', function () {
        expect(this.model.isAutoStyleEnabled()).toBe(true);
      });

      it('should return true with empty object style options', function () {
        this.model.set('style', {});
        expect(this.model.isAutoStyleEnabled()).toBe(true);
      });

      it('should return true with style options', function () {
        var style = {
          auto_style: {
            allowed: true
          }
        };
        this.model.set('style', style);
        expect(this.model.isAutoStyleEnabled()).toBe(true);
      });

      it('should return false with style options', function () {
        var style = {
          auto_style: {
            allowed: false
          }
        };
        this.model.set('style', style);
        expect(this.model.isAutoStyleEnabled()).toBe(false);
      });

      it('should be false if type is not category or histogram', function () {
        var model = new WidgetModel(null, {
          dataviewModel: dataviewModel,
          type: 'time-series'
        }, {autoStyleEnabled: true});

        expect(model.isAutoStyleEnabled()).toBeFalsy();
      });
    });

    describe('.getAutoStyle', function () {
      it('should not provide any info if auto-style is not enabled', function () {
        spyOn(this.model, 'isAutoStyleEnabled').and.returnValue(false);
        var data = this.model.getAutoStyle();
        expect(data).toEqual({});
      });

      it('should not provide any info if autoStyler is not defined', function () {
        spyOn(this.model, 'isAutoStyleEnabled').and.returnValue(true);
        this.model.autoStyler = undefined;
        var data = this.model.getAutoStyle();
        expect(data).toEqual({});
      });

      it('should return proper definition and cartocss when no style model present', function () {
        var definition = 'a definition';
        var cartocss = 'some cartocss';
        spyOn(this.model, 'isAutoStyleEnabled').and.returnValue(true);
        this.model.autoStyler = {
          getDef: function () {
            return definition;
          }
        };
        this.model.dataviewModel.layer.set('cartocss', cartocss);
        var expectedData = {
          definition: definition,
          cartocss: cartocss
        };

        var data = this.model.getAutoStyle();

        expect(_.isEqual(data, expectedData)).toBe(true);
      });

      it('should return proper definition and cartocss when auto_style property already present', function () {
        var definition = 'a definition';
        var cartocss = 'some cartocss';
        var style = {
          auto_style: {
            definition: 'other definition',
            cartocss: 'other cartocss',
            anotherProperty: 'another property'
          }
        };
        spyOn(this.model, 'isAutoStyleEnabled').and.returnValue(true);
        this.model.set('style', style);
        this.model.autoStyler = {
          getDef: function () {
            return definition;
          }
        };
        this.model.dataviewModel.layer.set('cartocss', cartocss);
        var expectedData = {
          definition: definition,
          cartocss: cartocss,
          anotherProperty: 'another property'
        };

        var data = this.model.getAutoStyle();

        expect(_.isEqual(data, expectedData)).toBe(true);
      });
    });

    describe('.hasColorsAutoStyle', function () {
      it('should return false if autostyle or auto-style definition is empty', function () {
        spyOn(this.model, 'getAutoStyle').and.returnValue({
          cartocss: '#dummy {}',
          definition: {}
        });
        expect(this.model.hasColorsAutoStyle()).toBe(false);
        this.model.getAutoStyle.and.returnValue({});
        expect(this.model.hasColorsAutoStyle()).toBe(false);
      });

      it('should return false if color or range doesn\'t exist', function () {
        spyOn(this.model, 'getAutoStyle').and.returnValue({
          cartocss: '#dummy {}',
          definition: {
            point: {}
          }
        });
        expect(this.model.hasColorsAutoStyle()).toBe(false);
        this.model.getAutoStyle.and.returnValue({
          cartocss: '#dummy {}',
          definition: {
            point: {
              color: {}
            }
          }
        });
        expect(this.model.hasColorsAutoStyle()).toBe(false);
      });

      it('should return false if there is no colors defined', function () {
        spyOn(this.model, 'getAutoStyle').and.returnValue({
          cartocss: '#dummy {}',
          definition: {
            point: {
              color: {
                range: []
              }
            }
          }
        });
        expect(this.model.hasColorsAutoStyle()).toBe(false);

        this.model.getAutoStyle.and.returnValue({
          cartocss: '#dummy {}',
          definition: {
            point: {
              color: {
                range: {}
              }
            },
            line: {
              color: {
                range: {}
              }
            },
            polygon: {
              color: {
                range: {}
              }
            }
          }
        });
        expect(this.model.hasColorsAutoStyle()).toBe(false);
      });

      it('should return true if autostyle return any color', function () {
        spyOn(this.model, 'getAutoStyle').and.returnValue({
          cartocss: '#dummy {}',
          definition: {
            point: {
              color: {
                range: ['#red']
              }
            }
          }
        });
        expect(this.model.hasColorsAutoStyle()).toBe(true);
      });
    });

    describe('.autoStyle', function () {
      beforeEach(function () {
        spyOn(this.model, 'isAutoStyleEnabled').and.returnValue(true);
        this.model.autoStyler = {
          getStyle: jasmine.createSpy('getStyle')
        };

        this.model.dataviewModel.layer.set('initialStyle', 'foo');
        this.model.dataviewModel.layer.set('cartocss', 'wadus');
      });

      it('should generate autostyle styles when dataview has data', function () {
        this.model.dataviewModel.set('data', [{
          name: 'foo'
        }, {
          name: 'bar'
        }]);
        this.model.autoStyle();

        expect(this.model.autoStyler.getStyle).toHaveBeenCalled();
        expect(this.model.dataviewModel.layer.get('initialStyle')).toBe('wadus');
      });

      it('should not generate autostyle styles when dataview has data', function () {
        this.model.dataviewModel.set('data', []);
        this.model.autoStyle();

        expect(this.model.autoStyler.getStyle).not.toHaveBeenCalled();
        expect(this.model.dataviewModel.layer.get('initialStyle')).toBe('foo');
      });
    });
  });

  describe('when autostyle option is disabled', function () {
    beforeEach(function () {
      var vis = specHelper.createDefaultVis();
      // Use a category dataview as example
      this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
        column: 'col'
      });
      this.dataviewModel.remove = spyOn(this.dataviewModel, 'remove');
    });

    describe('isAutoStyleEnabled', function () {
      it('should be true if without autostyle option', function () {
        var model = new WidgetModel(null, {
          dataviewModel: this.dataviewModel
        });

        model.set('type', 'category');

        expect(model.isAutoStyleEnabled()).toBe(true);
      });

      it('should be false if passed autostyle option as false', function () {
        var model = new WidgetModel(null, {
          dataviewModel: this.dataviewModel
        }, {autoStyleEnabled: false});

        model.set('type', 'category');

        expect(model.isAutoStyleEnabled()).toBe(false);
      });

      it('should be true if passed autostyle option as true', function () {
        var model = new WidgetModel(null, {
          dataviewModel: this.dataviewModel
        }, {autoStyleEnabled: true});

        model.set('type', 'category');

        expect(model.isAutoStyleEnabled()).toBe(true);
      });
    });
  });

  describe('.getWidgetColor', function () {
    beforeEach(function () {
      var vis = specHelper.createDefaultVis();
      // Use a category dataview as example
      this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
        column: 'col'
      });

      this.model = new WidgetModel(null, {
        dataviewModel: this.dataviewModel
      }, {autoStyleEnabled: false});
    });

    describe('when widget_color_changed is true', function () {
      it('should return color', function () {
        var style = {
          widget_style: {
            definition: {
              color: {
                fixed: '#fabada'
              }
            },
            widget_color_changed: true
          }
        };
        this.model.set('style', style);

        expect(this.model.getWidgetColor()).toBe('#fabada');
      });
    });

    describe('when widget_color_changed is false', function () {
      it('should not return color', function () {
        var style = {
          widget_style: {
            definition: {
              color: {
                fixed: '#9DE0AD'
              }
            },
            widget_color_changed: false
          }
        };
        this.model.set('style', style);

        expect(this.model.getWidgetColor()).toBe(false);
      });

      describe('and widget color value has changed', function () { // this is the case for existing widgets
        it('should return color', function () {
          var style = {
            widget_style: {
              definition: {
                color: {
                  fixed: '#fabada',
                  opacity: 1
                }
              }
            }
          };
          this.model.set('style', style);

          expect(this.model.getWidgetColor()).toBe('#fabada');
        });
      });
    });
  });

  describe('forceResize', function () {
    beforeEach(function () {
      this.model = new WidgetModel(null, {
        dataviewModel: this.dataviewModel
      });
    });

    it('should trigger forceResize event if it is a time-series', function () {
      spyOn(this.model, 'trigger');
      this.model.set('type', 'time-series');
      this.model.forceResize();

      expect(this.model.trigger).toHaveBeenCalledWith('forceResize');
    });

    it('should not trigger force Resize event if it is not a time-series', function () {
      spyOn(this.model, 'trigger');
      this.model.set('type', 'category');
      this.model.forceResize();

      expect(this.model.trigger).not.toHaveBeenCalledWith('forceResize');
    });
  });
});
