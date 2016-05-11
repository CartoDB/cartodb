var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
var Polyglot = require('node-polyglot');
var Locale = require('../../../../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

var _t = polyglot.t.bind(polyglot);

/*
 *  Dictionary that contains all the necessary components
 *  for the styles form
 */

function getSchema (querySchemaModel, filterFunction) {
  var columnsCollection = querySchemaModel.columnsCollection;
  if (filterFunction) {
    columnsCollection = columnsCollection[filterFunction];
  }
  return columnsCollection
    .map(function (m) {
      var columnName = m.get('name');
      return {
        val: columnName,
        label: columnName
      };
    });
}

function generateColumnsSchema (componentName, querySchemaModel, filterFunction) {
  var queryStatus = querySchemaModel.get('status');
  var isDisabled = queryStatus !== 'fetched';
  var helpMessage = _t('editor.style.components.' + componentName + '.' + queryStatus);

  return {
    type: 'Select',
    title: _t('editor.style.components.' + componentName + '.label'),
    help: isDisabled ? helpMessage : '',
    options: getSchema(querySchemaModel, filterFunction),
    editorAttrs: { disabled: isDisabled },
    validators: ['required']
  };
}

module.exports = {

  'fill': function (querySchemaModel) {
    return {
      type: 'Fill',
      title: _t('editor.style.components.fill'),
      options: getSchema(querySchemaModel),
      validators: ['required']
    };
  },

  'stroke': function (querySchemaModel) {
    return {
      type: 'Fill',
      title: _t('editor.style.components.stroke'),
      options: getSchema(querySchemaModel),
      editorAttrs: {
        size: {
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  },

  'blending': function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.blending.label'),
      options: [
        {
          val: 'none',
          label: _t('editor.style.components.blending.options.none')
        },
        {
          val: 'multiply',
          label: _t('editor.style.components.blending.options.multiply')
        },
        {
          val: 'screen',
          label: _t('editor.style.components.blending.options.screen')
        },
        {
          val: 'overlay',
          label: _t('editor.style.components.blending.options.overlay')
        },
        {
          val: 'darken',
          label: _t('editor.style.components.blending.options.darken')
        },
        {
          val: 'lighten',
          label: _t('editor.style.components.blending.options.lighten')
        },
        {
          val: 'color-dodge',
          label: _t('editor.style.components.blending.options.color-dodge')
        },
        {
          val: 'color-burn',
          label: _t('editor.style.components.blending.options.color-burn')
        }
      ]
    };
  },

  'labels-enabled': function () {
    return {
      type: 'Hidden'
    };
  },

  'labels-attribute': function (querySchemaModel) {
    return generateColumnsSchema('labels-attribute', querySchemaModel);
  },

  'labels-fill': function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-fill'),
      options: [],
      editorAttrs: {
        size: {
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  },

  'labels-halo': function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-halo'),
      options: [],
      editorAttrs: {
        size: {
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  },

  'labels-font': function () {
    return {
      type: 'Select',
      options: [
        'DejaVu Sans Book',
        'unifont Medium',
        'Open Sans Regular',
        'Lato Regular',
        'Lato Bold',
        'Lato Bold Italic',
        'Graduate Regular',
        'Gravitas One Regular',
        'Old Standard TT Regular',
        'Old Standard TT Italic',
        'Old Standard TT Bold'
      ]
    };
  },

  'labels-offset': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.labels-offset'),
      validators: ['required', {
        type: 'interval',
        min: -20,
        max: 20
      }]
    };
  },

  'labels-overlap': function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.labels-overlap.label'),
      options: [
        {
          val: true,
          label: _t('editor.style.components.labels-overlap.options.true')
        }, {
          val: false,
          label: _t('editor.style.components.labels-overlap.options.false')
        }
      ]
    };
  },

  'labels-placement': function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.labels-placement.label'),
      options: [
        {
          val: 'point',
          label: _t('editor.style.components.labels-placement.options.point')
        },
        {
          val: 'line',
          label: _t('editor.style.components.labels-placement.options.line')
        },
        {
          val: 'vertex',
          label: _t('editor.style.components.labels-placement.options.vertex')
        },
        {
          val: 'interior',
          label: _t('editor.style.components.labels-placement.options.interior')
        }
      ],
      editorAttrs: {
        showSearch: false
      }
    };
  },

  'animated-enabled': function () {
    return {
      type: 'Hidden'
    };
  },

  'animated-attribute': function (querySchemaModel) {
    return generateColumnsSchema('animated-attribute', querySchemaModel);
  },

  'animated-overlap': function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.animated-overlap.label'),
      options: [
        {
          val: false,
          label: _t('editor.style.components.animated-overlap.options.false')
        }, {
          val: true,
          label: _t('editor.style.components.animated-overlap.options.true')
        }
      ]
    };
  },

  'animated-duration': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-duration'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 1000
      }]
    };
  },

  'animated-steps': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-steps'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 2048
      }]
    };
  },

  'animated-trails': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-trails'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 5
      }]
    };
  },

  'animated-resolution': function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-resolution'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 32
      }]
    };
  }
};
