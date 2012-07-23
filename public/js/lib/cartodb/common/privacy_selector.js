  
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
    'click a': '_optionClicked'
  },

  default_options: {
    direction: 'up'
  },

  initialize: function() {
    _.bindAll(this, "_optionClicked");

    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate("common/views/privacy_selector");

    // Set visibility
    this.isOpen = false;
  },

  render: function() {
    // Render
    var $el = this.$el;
    $el.html(this.template_base());

    // Add selected


    return this;
  },

  show: function(target) {

    // Positionate
    var pos = $(target).position()
      , t_width = $(target).outerWidth()
      , t_height = $(target).outerHeight()
      , el_width = this.$el.outerWidth()
      , el_height = this.$el.outerHeight()

    //TODO: position dialog
    var top = pos.top - el_height + "px";
    if(this.options.direction === 'down') {
      top = pos.top + el_height + "px";
    }

    // Set css previous animation
    this.$el.css({
      opacity:0,
      display:"block",
      top: top,
      left: pos.left + (t_width/2) - (el_width/2) + "px",
      marginTop: "10px"
    });

    // Animate
    this.$el.animate({
      marginTop: "0",
      opacity:1
    },300);
  },

  hide: function(target) {

    // Animate
    this.$el.animate({
      marginTop: "-10px",
      opacity:0
    },300, function(){
      $(this).remove();
    });    
  },

  _optionClicked: function(ev) {
    ev.preventDefault();

    // New privacy status
    var new_status;

    if ($(ev.target).hasClass("public")) {
      new_status = "PUBLIC";
    } else {
      new_status = "PRIVATE";
    }

    // Save if it is a new privacy
    if (new_status != this.model.get("privacy").toUpperCase()) {
      this.model.set({privacy: new_status});
      this.model.save();
    } else {
      this.hide();
    }

  }

});
