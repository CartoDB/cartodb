

  /**
   *  Displays the quota of each user in the organization
   *
   *  - Current user or new user in blue colors.
   *  - Rest of them, grey color with tooltip
   */


  cdb.admin.organization.UserQuotaItem = cdb.core.View.extend({

    tagName: 'div',
    className: 'bar-1', 

    render: function() {
      var self = this;

      // Position
      this.$el.css({
        left: ((this.options.used * 100) / this.options.organization.get('quota_in_bytes')) + "%",
        width: ((this.model.get('quota_in_bytes') * 100) / this.options.organization.get('quota_in_bytes')) + "%"
      });

      // Tipsy
      this.$el.tipsy({
        fade: true,
        gravity: "s",
        offset: 5,
        title: function() {
          return self.model.get('username') + " (" + cdb.Utils.readablizeBytes(self.model.get('quota_in_bytes')) + ")"
        }
      })

      return this;
    },

    _destroyTipsy: function() {
      // Remove tipsy
      if (this.$el.data('tipsy')) {
        this.$el.unbind('mouseenter mouseleave');
        this.$el.data('tipsy').remove();
      }
    },

    clean: function() {
      this._destroyTipsy();
      cdb.core.View.prototype.clean.call(this);
    }

  });



  cdb.admin.organization.CurrentQuotaItem = cdb.admin.organization.UserQuotaItem.extend({
    
    className: 'bar-2',

    render: function() {
      cdb.admin.organization.UserQuotaItem.prototype.render.apply(this, arguments);

      if (this.model.get('username')) {
        // Add new bar-2
        this.$el
          .append(
            $('<div>')
              .addClass('bar-3')
              .css({
                left: ((this.options.used * 100) / this.options.organization.get('quota_in_bytes')) + "%",
                width: (((this.model.get('quota_in_bytes') - this.model.get('remaining_quota')) * 100) / this.options.organization.get('quota_in_bytes')) + "%"
              })
          );  
      }
      

      // Remove tooltip
      this._destroyTipsy();

      return this;
    }
  });



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
      })

      self.$el.append(current_item.render().el);
      self.addView(current_item);

      used += parseInt(this.user.get('quota_in_bytes'));

      // Rest of the users
      this.collection.each(function(m) {

        if (self.user.get('username') != m.get('username')) {
          var user_item = new cdb.admin.organization.UserQuotaItem({
            model: m,
            organization: self.model,
            used: used
          });

          self.$el.append(user_item.render().el);
          self.addView(user_item);

          used += parseInt(m.get('quota_in_bytes'));
        }
        
      });

      return this;
    }


  });