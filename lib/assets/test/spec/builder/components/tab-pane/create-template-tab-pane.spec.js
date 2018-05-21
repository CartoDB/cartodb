var _ = require('underscore');
var cdb = require('internal-carto.js');
var createTemplateTabPane = require('builder/components/tab-pane/create-template-tab-pane');
var templateButton = require('builder/components/tab-pane/tab-pane-template.tpl');

describe('components/tab-pane/create-template-tab-pane', function () {
  beforeEach(function () {
    this.items = [
      {
        selected: false,
        label: 'foo',
        name: 'foo',
        createContentView: function () {
          return new cdb.core.View();
        }
      }, {
        selected: false,
        label: 'bar',
        name: 'bar',
        createContentView: function () {
          return new cdb.core.View();
        }
      }
    ];

    this.options = {
      tabPaneTemplateOptions: {
        template: templateButton
      }
    };
  });

  it('should create view', function () {
    var view = createTemplateTabPane(this.items, this.options);
    expect(view.collection.size()).toEqual(2);

    view.render();
    expect(_.size(view._subviews)).toEqual(3);
  });

  it('should add the icons', function () {
    var view = createTemplateTabPane(this.items, this.options);
    view.render();
    expect(view.$el.find('i').length).toBe(2);
  });

  it('should throw error if label is not provided', function () {
    var items = _.clone(this.items, this.options);
    delete items[0].label;
    expect(function () { createTemplateTabPane(items, this.options); }).toThrow(new Error('label should be provided'));
  });

  it('should throw error if contentView is not provided', function () {
    var items = _.clone(this.items, this.options);
    delete items[0].createContentView;
    expect(function () { createTemplateTabPane(items); }).toThrow(new Error('createContentView should be provided'));
  });

  it('should throw error if name is not provided', function () {
    var items = _.clone(this.items, this.options);
    delete items[0].name;
    expect(function () { createTemplateTabPane(items); }).toThrow(new Error('name should be provided'));
  });

  it('should allow to set custom options for the pane and its items', function () {
    var view = createTemplateTabPane(this.items, {
      tabPaneOptions: {
        className: 'MyCoolIconTabPane',
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneTemplateOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase',
        template: templateButton
      }
    });
    view.render();
    expect(view.$el.hasClass('MyCoolIconTabPane')).toBeTruthy();
    expect(view.$el.find('li.CDB-NavMenu-item').length).toBe(2);
    expect(view.$el.find('button.CDB-NavMenu-link').length).toBe(2);
    expect(view.$el.find('i').length).toBe(2);
  });
});
