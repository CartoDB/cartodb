

  /**
   *  Displays the quota of each user in the organization
   *
   *  - Current user or new user in blue colors.
   *  - Rest of them, grey color with tooltip
   */



  /**
   *  Organization user quota element (usually grey progress)
   *  in edit or new user views.
   *
   *  new cdb.admin.organization.UserQuotaItem({
   *    model: user_model,
   *    organization: organization_model,
   *    used: organization_bytes_used, // at the moment
   *    paths: self.options.paths // URL paths
   *  })
   */

  cdb.admin.organization.UserQuotaItem = cdb.core.View.extend({

    events: {
      'click': '_onClick'
    },

    initialize: function() {
      _.bindAll(this, '_onClick');
      this.template = cdb.templates.getTemplate('organization/views/user_progress_quota');
      this.main_class = 'bar-1';
    },

    render: function() {
      var self = this;
      this.$el.html(this.template(this.model.toJSON()));

      // Position
      this.$('.' + this.main_class).css({
        left: ((this.options.used * 100) / this.options.organization.get('quota_in_bytes')) + "%",
        width: ((this.model.get('quota_in_bytes') * 100) / this.options.organization.get('quota_in_bytes')) + "%"
      });

      // Tipsy
      this.$('.' + this.main_class).tipsy({
        fade: true,
        gravity: "s",
        offset: 5,
        title: function() {
          return self.model.get('username') + " (" + cdb.Utils.readablizeBytes(self.model.get('quota_in_bytes')) + ")"
        }
      })

      return this;
    },

    _onClick: function(e) {
      if (e) e.preventDefault();
      window.location.href = _.template(this.options.paths.organization_user)(this.model.toJSON())
    },

    _destroyTipsy: function() {
      // Remove tipsy
      if (this.$('.' + this.main_class).data('tipsy')) {
        this.$('.' + this.main_class).unbind('mouseenter mouseleave');
        this.$('.' + this.main_class).data('tipsy').remove();
      }
    },

    clean: function() {
      this._destroyTipsy();
      cdb.core.View.prototype.clean.call(this);
    }

  });



  /**
   *  Current organization user quota element (usually blue progress)
   *  in edit or new user views.
   *
   *  It shows used bytes by the user if it is already created.
   *
   *  new cdb.admin.organization.CurrentQuotaItem({
   *    model: user_model,
   *    organization: organization_model,
   *    used: organization_bytes_used // at the moment
   *  })
   */

  cdb.admin.organization.CurrentQuotaItem = cdb.admin.organization.UserQuotaItem.extend({

    events: {},

    initialize: function() {
      this.template = cdb.templates.getTemplate('organization/views/current_progress_quota');
      this.main_class = 'bar-2';
    },

    render: function() {
      cdb.admin.organization.UserQuotaItem.prototype.render.apply(this, arguments);

      this.$('.bar-3')
        .css({
          left: ((this.options.used * 100) / this.options.organization.get('quota_in_bytes')) + "%",
          width: (((this.model.get('quota_in_bytes') - this.model.get('remaining_quota')) * 100) / this.options.organization.get('quota_in_bytes')) + "%"
        })
        [ this.model.get('username') ? 'show' : 'hide']()

      // Remove tooltip
      this._destroyTipsy();

      return this;
    }
  });


  /**
   *  Progress quota bar view.
   *
   *  new cdb.admin.organization.ProgressQuota({
   *    user: user_model,
   *    model: organization_model,
   *    collection: organization_users_collection,
   *    paths: self.options.paths // URL paths
   *  })
   */

  cdb.admin.organization.ProgressQuota = cdb.core.View.extend({

    initialize: function() {
      this.user = this.options.user;
    },

    render: function() {
      this.clearSubViews();

      this.$el.html('');

      var used = 0;
      var self = this;

      // Current user
      var current_item = new cdb.admin.organization.CurrentQuotaItem({
        model: this.user,
        organization: self.model,
        used: used
      });

      used += parseInt(this.user.get('quota_in_bytes'));
      self.$el.append(current_item.render().el);
      self.addView(current_item);
      

      // Rest of the users
      this.collection.each(function(m) {

        if (self.user.get('username') != m.get('username')) {
          var user_item = new cdb.admin.organization.UserQuotaItem({
            model: m,
            organization: self.model,
            used: used,
            paths: self.options.paths
          });

          self.$el.append(user_item.render().el);
          self.addView(user_item);

          used += parseInt(m.get('quota_in_bytes'));
        }
        
      });

      return this;
    }


  });