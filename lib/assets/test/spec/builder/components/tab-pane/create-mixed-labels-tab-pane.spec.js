var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createMixedLabelsTabPane = require('builder/components/tab-pane/create-mixed-labels-tab-pane');

describe('components/tab-pane/create-mixed-labels-tab-pane', function () {
  beforeEach(function () {
    this.items = [{
      selected: false,
      type: 'image',
      label: 'http://www.image.jpg',
      extra: {
        color: '#ff0000'
      },
      createContentView: function () {
        return new CoreView();
      }
    }, {
      selected: false,
      type: 'text',
      label: 'label two',
      createContentView: function () {
        return new CoreView();
      }
    }];
  });

  it('should create view', function () {
    var view = createMixedLabelsTabPane(this.items);
    expect(view).toEqual(jasmine.any(CoreView));
    expect(view.collection.size()).toEqual(2);

    view.render();
    expect(_.size(view._subviews)).toEqual(3);
  });

  it('should add the labels', function () {
    var view = createMixedLabelsTabPane(this.items);
    view.render();
    expect(view.$el.find('img').length).toBe(1);
    expect(view.$el.find('img').attr('src')).toBe('http://www.image.jpg?req=markup');
    expect(view.$el.html()).toContain('label two');
  });

  it('should throw error if label is not provided', function () {
    var items = _.clone(this.items);
    delete items[0].label;
    expect(function () { createMixedLabelsTabPane(items); }).toThrow(new Error('label should be provided'));
  });

  it('should throw error if contentView is not provided', function () {
    var items = _.clone(this.items);
    delete items[0].createContentView;
    expect(function () { createMixedLabelsTabPane(items); }).toThrow(new Error('createContentView should be provided'));
  });

  it('should allow to set custom options for the pane and its items', function () {
    var view = createMixedLabelsTabPane(this.items, {
      tabPaneOptions: {
        className: 'MyCoolLabelTabPane',
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    });
    view.render();
    expect(view.$el.hasClass('MyCoolLabelTabPane')).toBeTruthy();
    expect(view.$el.find('li.CDB-NavMenu-item').length).toBe(2);
    expect(view.$el.find('button.CDB-NavMenu-link').length).toBe(2);
  });
});
