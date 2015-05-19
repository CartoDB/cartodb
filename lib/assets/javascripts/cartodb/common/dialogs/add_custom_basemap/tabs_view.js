var cdb = require('cartodb.js');
var $ = require('jquery');

/**
 * View representing the tabs content of the dialog.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-open-old-dialog': '_openOldDialog'
  },

  initialize: function() {
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/tabs')({
        model: this.model
      })
    );
    var tabContentView = this._panes.active(this.model.get('currentTab')).render();
    $el.find('.js-tab-content').append(tabContentView.el);
    this.$el.html($el);
    tabContentView.delegateEvents(); // enable events after being added to $el
    return this;
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this.model.get('tabs').each(function(m) {
      this._panes.addTab(m.get('name'), m.createView());
    }, this);
  },

  _initBinds: function() {
    this.model.bind('change:currentTab', this.render, this);
  },

  // TODO: Remove once all tabs are implemented
  _openOldDialog: function(ev) {
    this.killEvent(ev);
    this.options.openOldDialog();
    this.hide();
  }

});
