
  /**
   *  Mixpanel class for CartoDB
   */  

  cdb.admin.Mixpanel = cdb.core.Model.extend({

    initialize: function(opts) {
      this._setMixpanel(opts.token);
      this._setUser(opts.user);
      this.bindEvents();
    },

    _setMixpanel: function(token) {
      mixpanel.init(token);
    },

    _setUser: function(user_data) {
      mixpanel.identify(user_data.username);
      mixpanel.name_tag(user_data.username);
      mixpanel.people.set({
        '$id':            user_data.id,
        '$email':         user_data.email,
        '$username':      user_data.username,
        '$account_type':  user_data.account_type
      });
    },

    bindEvents: function() {
      cdb.god.bind("mixpanel", this._setTrack, this);
    },

    _setTrack: function(msg, obj) {
      mixpanel.track(msg, obj)
    }
  });