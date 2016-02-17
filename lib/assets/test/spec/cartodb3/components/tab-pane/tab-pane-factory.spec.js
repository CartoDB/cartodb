var TabPaneView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-view');
var TabPaneViewFactory = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-factory');
var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');

describe('components/tab-pane-factory', function () {
  describe('with text labels', function () {
    beforeEach(function () {
      this.items = [{
        selected: false,
        label: 'label one',
        createContentView: function () {
          return new cdb.core.View();
        }
      }, {
        selected: false,
        label: 'label two',
        createContentView: function () {
          return new cdb.core.View();
        }
      }];
    });

    it('should create view', function () {
      var view = TabPaneViewFactory.createWithTextLabels(this.items);
      expect(view).toEqual(jasmine.any(TabPaneView));
      expect(view.collection.size()).toEqual(2);

      view.render();
      expect(_.size(view._subviews)).toEqual(3);
    });

    it('should add the labels', function () {
      var view = TabPaneViewFactory.createWithTextLabels(this.items);
      view.render();
      expect(view.$el.html()).toContain('label one');
      expect(view.$el.html()).toContain('label two');
    });

    it('should throw error if label is not provided', function () {
      var items = _.clone(this.items);
      delete items[0].label;
      expect(function () { TabPaneViewFactory.createWithTextLabels(items); }).toThrow(new Error('label should be provided'));
    });

    it('should throw error if contentView is not provided', function () {
      var items = _.clone(this.items);
      delete items[0].createContentView;
      expect(function () { TabPaneViewFactory.createWithTextLabels(items); }).toThrow(new Error('createContentView should be provided'));
    });

    it('should allow to set custom options for the pane and its items', function () {
      var view = TabPaneViewFactory.createWithTextLabels(this.items, {
        tabPaneOptions: {
          className: 'MyCoolLabelTabPane',
          tabPaneItemOptions: {
            tagName: 'li',
            className: 'CDB-NavMenu-Item'
          }
        },
        tabPaneItemLabelOptions: {
          tagName: 'button',
          className: 'CDB-NavMenu-Link'
        }
      });
      view.render();
      expect(view.$el.hasClass('MyCoolLabelTabPane')).toBeTruthy();
      expect(view.$el.find('li.CDB-NavMenu-Item').length).toBe(2);
      expect(view.$el.find('button.CDB-NavMenu-Link').length).toBe(2);
    });
  });

  describe('with icons', function () {
    beforeEach(function () {
      this.items = [
        {
          selected: false,
          icon: 'myFirstIcon',
          createContentView: function () {
            return new cdb.core.View();
          }
        }, {
          selected: false,
          icon: 'mySecondIcon',
          createContentView: function () {
            return new cdb.core.View();
          }
        }
      ];
    });

    it('should create view', function () {
      var view = TabPaneViewFactory.createWithIcons(this.items);
      expect(view).toEqual(jasmine.any(TabPaneView));
      expect(view.collection.size()).toEqual(2);

      view.render();
      expect(_.size(view._subviews)).toEqual(3);
    });

    it('should add the icons', function () {
      var view = TabPaneViewFactory.createWithIcons(this.items);
      view.render();
      expect(view.$el.find('i.CDB-IconFont-myFirstIcon').length).toBe(1);
      expect(view.$el.find('i.CDB-IconFont-mySecondIcon').length).toBe(1);
    });

    it('should throw error if icon is not provided', function () {
      var items = _.clone(this.items);
      delete items[0].icon;
      expect(function () { TabPaneViewFactory.createWithIcons(items); }).toThrow(new Error('icon should be provided'));
    });

    it('should throw error if contentView is not provided', function () {
      var items = _.clone(this.items);
      delete items[0].createContentView;
      expect(function () { TabPaneViewFactory.createWithIcons(items); }).toThrow(new Error('createContentView should be provided'));
    });

    it('should allow to set custom options for the pane and its items', function () {
      var view = TabPaneViewFactory.createWithIcons(this.items, {
        tabPaneOptions: {
          className: 'MyCoolIconTabPane',
          tabPaneItemOptions: {
            tagName: 'li',
            className: 'CDB-NavMenu-Item'
          }
        },
        tabPaneItemIconOptions: {
          tagName: 'button',
          className: 'CDB-NavMenu-Link'
        }
      });
      view.render();
      expect(view.$el.hasClass('MyCoolIconTabPane')).toBeTruthy();
      expect(view.$el.find('li.CDB-NavMenu-Item').length).toBe(2);
      expect(view.$el.find('button.CDB-NavMenu-Link').length).toBe(2);
    });
  });
});
