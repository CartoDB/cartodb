
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

        // If table has organization user or all vis users has permission in this table,
        // let's add it
        if ( isOrgPerm || _.difference(vis_users, all_table_users).length === 0) {
          var obj = {
            vis_id:     mdl.get('id'),
            name:       mdl.get('name'),
            username:   '',
            avatar:     '',
            permission: ''
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
        } else {
          return null;
        }
      }, this);

      return _.compact(tables_list);
    }

  });