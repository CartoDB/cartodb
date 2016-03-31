var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var createTextLabelsTabPane = require('../../../../../javascripts/cartodb3/components/tab-pane/create-text-labels-tab-pane');

describe('components/tab-pane/create-text-labels-tab-pane', function () {
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
    var view = createTextLabelsTabPane(this.items);
    expect(view).toEqual(jasmine.any(cdb.core.View));
    expect(view.collection.size()).toEqual(2);

    view.render();
    expect(_.size(view._subviews)).toEqual(3);
  });

  it('should add the labels', function () {
    var view = createTextLabelsTabPane(this.items);
    view.render();
    expect(view.$el.html()).toContain('label one');
    expect(view.$el.html()).toContain('label two');
  });

  it('should throw error if label is not provided', function () {
    var items = _.clone(this.items);
    delete items[0].label;
    expect(function () { createTextLabelsTabPane(items); }).toThrow(new Error('label should be provided'));
  });

  it('should throw error if contentView is not provided', function () {
    var items = _.clone(this.items);
    delete items[0].createContentView;
    expect(function () { createTextLabelsTabPane(items); }).toThrow(new Error('createContentView should be provided'));
  });

  it('should allow to set custom options for the pane and its items', function () {
    var view = createTextLabelsTabPane(this.items, {
      tabPaneOptions: {
        className: 'MyCoolLabelTabPane',
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-Link u-upperCase'
      }
    });
    view.render();
    expect(view.$el.hasClass('MyCoolLabelTabPane')).toBeTruthy();
    expect(view.$el.find('li.CDB-NavMenu-Item').length).toBe(2);
    expect(view.$el.find('button.CDB-NavMenu-Link').length).toBe(2);
  });
});
