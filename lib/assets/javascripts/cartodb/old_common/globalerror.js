
/**
 * Small moving label used to show errors in operations
 */

cdb.admin.GlobalError = cdb.core.View.extend({
  
  DEFAULT_TAG: '',

  initialize: function() {
    _.bindAll(this, 'hide');
    this._lastType = -1;
    this._lastTag = this.DEFAULT_TAG;
  },

  templates: {
    'info': 'old_common/views/notifications/info',
    'warn': 'old_common/views/notifications/info',
    'error': 'old_common/views/notifications/info',
    'load': 'old_common/views/notifications/loading'
  },

  priority: {
    'error': 3,
    'warn': 2,
    'info': 1,
    'load': 0
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
  showError: function(text, type, timeout, tag) {
    tag = tag || this.DEFAULT_TAG;
    timeout = timeout === undefined ? 2000: timeout;
    type || (type = 'info')

    var priority = this.priority[type] || 0;
    var currentPriority = this.priority[this._lastType] || 0;
    if(priority < currentPriority) {
      return;
    }
    this._lastType = type;
    this._lastTag = tag;

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

  hide: function(tag) {
    tag = tag || this.DEFAULT_TAG;
    if(this._lastTag !== tag) return;
    this.$el.find("p").stop().animate({marginTop: 40}, 500);
    this._timer = 0;
    this._lastType = -1;
    this._lastTag = this.DEFAULT_TAG;
  },

  listenGlobal: function() {
    cdb.god.bind('error', this.showError, this);
  }

});
