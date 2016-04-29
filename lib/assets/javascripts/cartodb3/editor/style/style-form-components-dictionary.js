var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
var Polyglot = require('node-polyglot');
var Locale = require('../../../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}

var _t = polyglot.t.bind(polyglot);

/*
 *
 *
 */

module.exports = {

  'labels-enabled': {
    type: 'Hidden'
  },

  // 'labels-fill': {
  //   type: 'Fill',
  //   title: _t('editor.style.components.labels-fill')
  // },

  'labels-offset': {
    type: 'Number',
    title: _t('editor.style.components.labels-offset'),
    validators: ['required', {
      type: 'interval',
      min: -20,
      max: 20
    }]
  },

  // 'labels-halo': {
  //   type: 'Fill',
  //   title: _t('editor.style.components.labels-halo')
  // },

  'labels-overlap': {
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
  },

  'labels-placement': {
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
    ]
  },

  'animated-enabled': {
    type: 'Hidden'
  },

  'animated-overlap': {
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
  }
};
