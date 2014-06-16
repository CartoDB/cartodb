
  /**
   *  Setting password for any model
   *
   *
   *  - Needs a model to set a password
   *  - Needs the model attribute to set the password
   *
   */

  
  cdb.admin.PrivacyPassword = cdb.core.View.extend({

    events: {

    },

    initialize: function() {

    },

    render: function() {
      this.$el.html('password');
      return this;
    }

  })