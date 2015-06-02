
  /**
   *  Mixpanel class for CartoDB
   *
   *  - Track user events in CartoDB. Mixpanel is created
   *  from the beginning as a global variable, so it is
   *  called as it is created.
   *  - When an event is launched, you can use our God to
   *  save the action (cdb.god.trigger('mixpanel', "Import failed")).
   *
   *  new cdb.admin.Mixpanel({
   *    user:   { email: "mix@pan.el",... },
   *    token:  "mixpanel-token"
   *  });
   */

  cdb.admin.Mixpanel = cdb.core.Model.extend({

    initialize: function(opts) {
      if(opts.token !== "") {
        this._setMixpanel(opts.token);
        this._setUser(opts.user);
        this.bindEvents();
      }
    },

    _setMixpanel: function(token) {
      mixpanel.init(token);
    },

    _setUser: function(user_data) {
      mixpanel.identify(user_data.username);
      mixpanel.name_tag(user_data.username);
      mixpanel.people.set({
        '$email':                        user_data.email,
        '$username':                     user_data.username,
        'account_type':                  user_data.account_type,
        'table_count':                   user_data.table_count,
        'last_visualization_created_at': user_data.last_visualization_created_at,
        'visualization_count':           user_data.visualization_count,
        'failed_import_count':           user_data.failed_import_count,
        'success_import_count':          user_data.success_import_count,
        'quota_space':                   user_data.db_size_in_megabytes
      });
      if (user_data.organization) {
        mixpanel.people.set({
          'enterprise_org': user_data.organization.name
        });
      }
    },

    bindEvents: function() {
      cdb.god.bind("mixpanel", this._setTrack, this);
      cdb.god.bind("mixpanel_people", this._peopleSet, this);
    },

    _setTrack: function(msg, obj) {
      mixpanel.track(msg, obj)
    },

    _peopleSet: function(properties) {
      mixpanel.people.set(properties)
    }
  });
