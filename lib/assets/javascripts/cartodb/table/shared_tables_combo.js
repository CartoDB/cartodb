
  /**
   *  Combo with all available shared tables (table or derived)
   *
   *  - It will show visualizations owner if user belongs
   *    to a organization.
   *
   *  new cdb.admin.SharedTablesCombo({
   *    model:  visualizations_model,
   *    vis:    visualization_model,
   *    user:   user_model
   *  });
   *
   */

  cdb.admin.SharedTablesCombo = cdb.ui.common.VisualizationsSelector.extend({

    initialize: function() {
      if (!this.model || !this.options.user || !this.options.vis) {
        cdb.log.info('Visualizations, user and vis models are required')
      }

      this.user = this.options.user;
      this.vis = this.options.vis;

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      // Create element to render combo
      var $div = $('<div>');
      this.$el.append($div);

      // Create combo
      var combo = new cdb.forms.SharedTableCombo({
        el:       $div,
        property: "table",
        width:    "100%",
        extra:    this._generateList()
      });
      combo.bind('change', this._onComboChange, this);

      this.$el.append(combo.render().el);
      this.addView(combo);

      // Send signal of change when combo is initialized again
      this._onComboChange();

      return this;
    },

    _generateList: function() {

      // Get all users with permission from the visualization
      var vis_users = _.pluck(this.vis.permission.getUsersWithAnyPermission(), 'id');

      var tables_list = this.model.map(function(mdl){

        // Check if the table has an organization permission
        var isOrgPerm = mdl.permission.acl.find(function(u) { return u.get('type') === 'org' });

        // Get all table permission users + owner
        var table_users = _.pluck(mdl.permission.getUsersWithAnyPermission(),'id');
        var owner_user = mdl.permission.owner.id;
        var all_table_users = table_users.concat(owner_user);

        var obj = {
          vis_id:     mdl.get('id'),
          name:       mdl.get('name'),
          username:   '',
          avatar:     '',
          permission: '',
          enabled:    isOrgPerm || _.difference(vis_users, all_table_users).length === 0 ? true : false
        };
        
        if (this.user.isInsideOrg() && mdl.permission.owner) {
          var d = mdl.permission.owner.renderData(this.user);
          obj = _.extend(obj, {
            username:   d.username,
            avatar:     d.avatar_url,
            permission: mdl.permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY ? 'READ': null
          })
        }

        return obj;
      
      }, this);

      return _.compact(tables_list);
    }

  });


  /**
   *  An extended combo for available shared tables,
   *  extended from cdb.forms.Combo
   *
   */

  cdb.forms.SharedTableCombo = cdb.forms.VisualizationCombo.extend({

    _TEXTS: {
      disabled: _t('This table is not shared with the rest of the visualization users')
    },

    _ITEM_TEMPLATE: _t(' \
      <div class="vis-info-item <%- !enabled ? "disabled" : "" %> <%- username ? "shared" : "" %>">\
        <div class="value" title="<%- id %>" alt="<%- id %>"><%- id %></div>\
        <% if (username) { %>\
          <div class="by">\
            <% if (permission) { %>\
              <span class="permission round grey"><%- permission %></span>\
            <% } %>\
            <span class="username">by <%- username %></span>\
            <% if (avatar) { %>\
              <img class="avatar" src="<%- avatar %>" title="<%- username %>" alt="<%- username %>"/>\
            <% } %>\
          </div>\
        <% } %>\
      </div>\
    '),

    _getOptions: function() {
      var self = this;
      var options = _.map(this.data, function(option) {
        return '<option data-message="' + self._TEXTS.disabled + '" data-vis_id="' + option.vis_id + '" data-permission="'+ option.permission + '" data-name="' + option.name + '" ' + 
          ' data-avatar="' + option.avatar + '" data-enabled="' + option.enabled + '" data-username="' + option.username + '" ' + ( !option.enabled ? 'disabled' : '' ) + '>' + option.name + '</option>';
      }).join("");

      if (this.options.placeholder) options = "<option></option>" + options;

      return options;
    }

  });