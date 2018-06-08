var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var cdb = require('internal-carto.js');
var baseTemplate = require('./error.tpl');

/**
 * A typical error view.
 * @param {Object} options
 * @param {String} options.title If not provided will use a generic text as fallback
 * @param {String} options.desc If not provied will use a generic text as fallback
 */
module.exports = CoreView.extend({

  className: 'IntermediateInfo',

  initialize: function (opts) {
    var attrs = _.defaults(
      _.pick(opts, ['title', 'desc']),
      {
        title: _t('components.error.default-title'),
        desc: _t('components.error.default-desc')
      }
    );
    this._template = this.options && this.options.template || baseTemplate;
    this.model = new Backbone.Model(attrs);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    var m = this.model;
    return this._template({
      title: m.get('title'),
      desc: cdb.core.sanitize.html(m.get('desc'))
    });
  }
});
