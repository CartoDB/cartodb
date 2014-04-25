
  /**
   * Show upgrade window when reach account limits
   *
   * It goes to upgrade "central" when user selects a new plan :)
   *
   */

  cdb.admin.UpgradeDialog = cdb.admin.BaseDialog.extend({

    events: function() {
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
          'click ul.instances li a' : '_onInstanceClick',
          'click a.year_paid':        '_onYearPaidClick'
      });
    },

    initialize: function() {
      _.bindAll(this, "_setInstance", "_onYearPaidClick", "_onInstanceClick");

      // Extend options
      _.extend(this.options, {
        title: 'You have reached your account limits',
        description: 'Why don’t you think in upgrading your account?',
        width: 932,
        clean_on_hide: true,
        template_name: 'common/views/upgrade_dialog_base',
        ok_title: 'Upgrade your account',
        ok_button_classes: 'button blue',
        modal_class: "upgrade_account",
        modal_type: "notification",
        protocol: "http:"
      });
      this.constructor.__super__.initialize.apply(this);
    },


    /**
     * Render the content for the create dialog
     */
    render_content: function() {
      var $content = this.$content = $("<ul>").addClass("instances")
        , self = this
        , ajaxDone = false;

      var protocol = window.location.protocol;
      if(protocol.indexOf('file') >= 0) {
        protocol = 'http:'
      }

      var xhr = $.ajax({
        url: protocol + '//' + this.options.config.account_host + '/account/' + this.model.get("username") + '.json',
        type: 'GET',
        dataType: this.options.requestDataType || 'jsonp',
        success: function(r) {
          ajaxDone = true;
          if (r.available_plans.length > 0) {
            self._renderPlans($content, r);
          } else {
            self._renderDedicated($content, r);
          }
        },
        error: function(e) {
          ajaxDone = true;
          // Noooooooooooooo
          $content.addClass('disabled');
        }
      });

      // Check after 3 seconds if the request has failed silently
      setTimeout(function(){
        if (!ajaxDone) {
          xhr.abort();
          $content.addClass('disabled');  
        }        
      }, 3000);

      return this.$content;
    },


    /**
     *  Render pricing list as a normal instance
     */
    _renderPlans: function($content, r) {
      var self = this
        , username = this.model.get("username")
        , template = cdb.templates.getTemplate('common/views/upgrade_dialog_content');

      // Add intance types
      _.each(r.available_plans, function(data){
        
        // Transform data to readable text

        // 1) Price
        data.price = self._formatNumber(data.price);

        // 2) Table quota
        if (data.tables_quota) {
          data.tables_quota = "Up to " + data.tables_quota + " tables";
        } else {
          data.tables_quota = "Unlimited tables";
        }

        // 3) Disk quota
        if (data.bytes_quota) {
          data.bytes_quota = "Up to " + self._readablizeBytes(data.bytes_quota);
        } else {
          data.bytes_quota = "Unlimited quota";
        }

        // 4) Lump-sum price
        if (data.lump_sum && data.lump_sum.price) {
          data.lump_sum.price = self._formatNumber(data.lump_sum.price);
        }

        if (data.title != "FREE")
          $content.append(template(data));
      });

      // Add ghost form
      this.$content.prepend('<form class="hide" action="' + window.location.protocol + '//' + this.options.config.account_host + '/account/' + username + '/process_change_subscription" method="POST"><input type="text" name="server" value="" /></form>');

      // Set instance
      this._setInstance($content, r.available_plans);

      // Active the list
      $content.addClass('active');

      // Show buttons
      this.$('div.foot').show()
    },


    /**
     *  Render pricing list as a dedicated instance
     */
    _renderDedicated: function($content, r) {
      var username = this.model.get("username")
        , template = cdb.templates.getTemplate('common/views/upgrade_dedicated_dialog_content');

      // Resize the window
      this.$('.modal').animate({
        width: 608
      }, 200);

      // Remove old content and append new content
      this.$('div.content')
        .html('')
        .append(template());

      // Head description removed
      this.$('div.head p').remove();
    },


    /**
     *  Suggest a better instance
     */
    _setInstance: function($el, plans) {
      var account_type = this.model.get("account_type")
        , new_one, index
        , self = this;

      _.each(plans, function(plan,i){
        if (plan.title == account_type) {
          index = i;
          self.plan = plan.recurly_plan_code;
        }
      });

      // Set by default FREE -> JOHN SNOW and not magellan :)
      if (index == 0) {
        index++;
        this.plan = plans[index].recurly_plan_code;
      }

      // Set selected type
      $el.find(" > li:eq(" + index + ")")
        .addClass("selected")
        .find("a.button")
          .removeClass('grey')
          .addClass("selected green")

      // Save this option in the form
      $el.find("form input").val(this.plan);
    },


    
    /**
     *  String helper functions
     */

    // Readable bytes
    _readablizeBytes: function(bytes) {
      var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes)/Math.log(1024));
      return (bytes/Math.pow(1024, Math.floor(e))).toFixed(0)+" "+s[e];
    },

    // Format number
    _formatNumber: function(str) {
      var amount = new String(str);
      amount = amount.split("").reverse();

      var output = "";
      for ( var i = 0; i <= amount.length-1; i++ ){
        output = amount[i] + output;
        if ((i+1) % 3 == 0 && (amount.length-1) !== i)output = ',' + output;
      }
      return output;
    },


    /**
     *  When clicks over an instance
     */
    _onInstanceClick: function(e) {
      e.preventDefault();

      var $li = $(e.target).closest("li")
        , clicked_type = $li.data("recurly_plan_code");

      if (clicked_type == self.plan) {
        return false;
      }

      // Remove previous selected
      this.$("li.selected").removeClass("selected");
      this.$("a.selected").removeClass("selected green").addClass("grey");

      // Set new selected
      $li.addClass("selected")
        .find("a.button")
          .removeClass('grey')
          .addClass("selected green")

      // Save this option in the form
      this.$("form input").val(clicked_type);
    },


    /**
     *  On click over year paid in a plan  
     */
    _onYearPaidClick: function(e) {
      e.preventDefault();

      var recurly_plan_code = $(e.target).data("recurly_plan_code")
      this.$("form input").val(recurly_plan_code);
      this.$("form").submit();
      this.hide();
    },


    /**
     *  Hide the dialog
     */
    ok: function() {
      this.$("form").submit();
      this.hide();
    },


    /**
     *  Hide the dialog
     */
    hide: function() {
      var self = this;

      this.$el.find(".modal").animate({
        marginTop: "50px",
        opacity: 0
      },300, function() {
        if(self.options.clean_on_hide) {
          self.clean();
        }
      });
      this.$el.find(".mamufas").fadeOut(300);
      this.trigger("closedDialog", this , this);
    }
  });
