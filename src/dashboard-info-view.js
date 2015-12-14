var View = cdb.core.View
var template = require('./dashboard-info-view.tpl')
var moment = require('moment')

var DashboardInfoView = View.extend({
  className: 'CDB-Dashboard-info',

  events: {
    'click .js-toggle-view-link': '_toggleView'
  },

  render: function () {
    this.$el.html(
      template({
        title: this.model.get('title'),
        description: this.model.get('description'),
        updatedAt: moment(this.model.get('updatedAt')).fromNow(),
        userName: this.model.get('userName'),
        userAvatarURL: this.model.get('userAvatarURL')
      })
    )

    return this
  },

  _toggleView: function () {
    this.$el.toggleClass('is-active')
  }
})

module.exports = DashboardInfoView
