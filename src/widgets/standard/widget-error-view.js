var View = require('cartodb.js').core.View
var template = require('./widget-error-template.tpl')

/**
 *  Default widget error view:
 *
 *  It will listen or not to dataModel changes when
 *  first load is done.
 */
module.exports = View.extend({
  className: 'CDB-Widget-error is-hidden',

  events: {
    'click .js-refresh': '_onRefreshClick'
  },

  initialize: function () {
    this._initBinds()
  },

  render: function () {
    this.$el.html(template())
    return this
  },

  _initBinds: function () {
    this.model.bind('error', this.show, this)
    this.model.bind('loading', this.hide, this)
  },

  _onRefreshClick: function () {
    this.model.refresh()
  },

  show: function () {
    this.$el.removeClass('is-hidden')
  },

  hide: function () {
    this.$el.addClass('is-hidden')
  }

})
