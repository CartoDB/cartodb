
/**
 * Small moving label used to show errors in operations
 */

cdb.admin.GlobalError = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, 'hide');
  },

  templates: {
    'info': 'common/views/notifications/info',
    'error': 'common/views/notifications/info',
    'load': 'common/views/notifications/loading'
  },
  /**
   * Returns the fetched template of the passed type
   * @param  {String} type
   * @return {Function}
   */
  getTypeTemplate: function(type) {
    var url = this.templates[type]? this.templates[type] : this.templates["info"];
    var tmpl = this.getTemplate(url);
    return tmpl;
  },
  // type can be: 'info', 'error'
  showError: function(text, type, timeout) {
    timeout = timeout === undefined ? 2000: timeout;
    type || (type = 'info')

    this.$el.html(this.getTypeTemplate(type)({text: text, type: type}));

    if(this._timer) {
      clearTimeout(this._timer);
    }
    if(timeout > 0) {
      this._timer = setTimeout(this.hide, timeout);
    }
    this.show();
  },

  show: function() {
    this.$el.find("p").stop().animate({marginTop: 0}, 500);
  },

  hide: function() {
    this.$el.find("p").stop().animate({marginTop: 40}, 500);
    this._timer = 0;
  }

});
