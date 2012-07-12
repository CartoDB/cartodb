  
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

cdb.admin.PrivacySelector = cdb.core.View.extend({

  tagName: 'div',
  className: 'privacy_selector',

  events: {
    //'click a.selected': '',
    'click a': '_optionClicked'
  },

  default_options: {
  },

  initialize: function() {
    _.bindAll(this, "_optionClicked");

    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate("common/views/privacy_selector");
  },

  render: function() {
    // Render
    var $el = this.$el;
    $el.html(this.template_base());
    return this;
  },

  _optionClicked: function(ev) {
    ev.preventDefault();

    this.model.set({privacy: "PUBLIC"});
    this.model.save();
  }

});