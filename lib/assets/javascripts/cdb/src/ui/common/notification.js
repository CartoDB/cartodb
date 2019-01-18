/**
 * generic embbed notification, like twitter "new notifications"
 *
 * it shows slowly the notification with a message and a close button.
 * Optionally you can set a timeout to close
 *
 * usage example:
 *
      var notification = new cdb.ui.common.Notificaiton({
          el: "#notification_element",
          msg: "error!",
          timeout: 1000
      });
      notification.show();
      // close it
      notification.close();
*/

cdb.ui.common.Notification = cdb.core.View.extend({

  tagName: 'div',
  className: 'dialog',

  events: {
    'click .close': 'hide'
  },

  default_options: {
      timeout: 0,
      msg: '',
      hideMethod: '',
      duration: 'normal'
  },

  initialize: function() {
    this.closeTimeout = -1;
    _.defaults(this.options, this.default_options);
    this.template = this.options.template ? _.template(this.options.template) : cdb.templates.getTemplate('common/notification');

    this.$el.hide();
  },

  render: function() {
    var $el = this.$el;
    $el.html(this.template(this.options));
    if(this.render_content) {
      this.$('.content').append(this.render_content());
    }
    return this;
  },

  hide: function(ev) {
    var self = this;
    if (ev)
      ev.preventDefault();
    clearTimeout(this.closeTimeout);
    if(this.options.hideMethod != '' && this.$el.is(":visible") ) {
      this.$el[this.options.hideMethod](this.options.duration, 'swing', function() {
        self.$el.html('');
        self.trigger('notificationDeleted');
        self.remove();
      });
    } else {
      this.$el.hide();
      self.$el.html('');
      self.trigger('notificationDeleted');
      self.remove();
    }

  },

  open: function(method, options) {
    this.render();
    this.$el.show(method, options);
    if(this.options.timeout) {
        this.closeTimeout = setTimeout(_.bind(this.hide, this), this.options.timeout);
    }
  }

});

