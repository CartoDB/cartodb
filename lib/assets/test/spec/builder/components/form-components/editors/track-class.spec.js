var _ = require('underscore');
var Backbone = require('backbone');
var editorsWithoutTrackClass = ['Base', 'Object', 'NestedModel'];
var editorsNotInCARTO = ['Checkbox', 'Checkboxes', 'Date'];
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

var OPTIONS_BY_TYPE = {
  'EnablerEditor': {
    editor: {
      type: 'Text'
    }
  },
  'Slider': {
    labels: ['hello', 'hey']
  },
  'Size': {
    schema: {
      editorAttrs: {}
    }
  },
  'Fill': {
    model: new Backbone.Model({
      names: 'pepe',
      stroke: {
        size: {
          range: [1, 30],
          attribute: 'the_geom',
          quantification: 'Quantile'
        },
        color: {
          bins: 5,
          range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
          attribute: 'column1',
          quantification: 'Jenks',
          opacity: 0.5
        }
      }
    }),
    schema: {
      configModel: {},
      query: 'SELECT * from table',
      options: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ]
    }
  },
  'FillColor': {
    model: new Backbone.Model({
      names: 'pepe',
      key: 'color',
      size: {
        range: [1, 30],
        attribute: 'the_geom',
        quantification: 'Quantile',
        editorAttrs: {
          geometryName: 'point'
        }
      },
      fillColor: {
        bins: 5,
        fixed: '#FABADA',
        attribute: 'column1',
        quantification: 'Jenks',
        opacity: 0.5,
        editorAttrs: {
          geometryName: 'point'
        }
      },
      help: {
        color: {
          colorAttributes: {}
        }
      }
    }),
    schema: {
      configModel: {},
      userModel: {},
      editorAttrs: {},
      modals: {},
      dialogMode: DialogConstants.Mode.FLOAT,
      query: 'SELECT * from table',
      options: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ]
    }
  },
  'TagList': {
    schema: {
      options: {
        tags: ['foo', 'bar', 'lol'],
        isEditable: true
      }
    }
  },
  'DataObservatoryDropdown': {
    measurementModel: {},
    measurements: [],
    filters: [],
    configModel: new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    }),
    nodeDefModel: {},
    region: 'wadus'
  },
  'LazySelect': {
    configModel: new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    }),
    nodeDefModel: {
      querySchemaModel: new Backbone.Model({
        query: ''
      })
    },
    column: 'foo',
    model: new Backbone.Model({
      foo: 'bar'
    })
  }
};

describe('components/form-components/editors/track-class', function () {
  describe('trackingClass for', function () {
    _.each(Backbone.Form.editors, function (_class, key) {
      if (_.contains(editorsWithoutTrackClass, key) || _.contains(editorsNotInCARTO, key)) {
        return false;
      }

      var options = _.extend(
        {
          key: 'color',
          schema: {
            options: []
          },
          model: new Backbone.Model({ color: 'a' })
        },
        OPTIONS_BY_TYPE[key] || {}
      );

      describe(key, function () {
        it('should not add the class if it not is specified', function () {
          var view = new _class(options);
          expect(view.$el.hasClass('track-class-whatever')).toBeFalsy();
          expect(view.options.trackingClass).toBeUndefined();
          view.remove();
        });

        it('should add the class if it is specified', function () {
          var view = new _class(
            _.extend(options, {
              trackingClass: 'track-class-whatever'
            })
          );

          expect(view.$el.hasClass('track-class-whatever')).toBeTruthy();
          view.remove();
        });
      });
    });
  });
});
