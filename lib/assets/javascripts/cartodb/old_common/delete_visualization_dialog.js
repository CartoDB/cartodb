
  /**
   *  Delete visualization dialog
   *
   *  - It needs the visualization model to check
   *    the amount of permissions over it.
   *  - It will check if you leave shared users
   *    without that visualization if user belongs
   *    to a visualization. 
   *
   */

  cdb.admin.DeleteVisualizationDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      users_visibility: _t('Also, by deteleting this map you will be revoking access to the \
                            following users within your organization:')
    },

    initialize: function(options) {
      _.extend(this.options, {
        title: "Delete this map",
        template_name: 'old_common/views/dialog_base',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: "Ok, delete",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        width: 510,
        modal_class: 'delete_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $div = $('<div>');
      var template = this.getTemplate('old_common/views/delete_visualization_dialog')();
      $div.append(template);

      // Is this visu/permissionalization shared?
      // If so, we should show who could lose the visibility
      // of this visualization
      if (this.model.permission && this.model.permission.acl.size() > 0) {

        var user_list_info = new cdb.ui.common.UserListWarning({
          className:  'common-users-list warning margin10',
          list:       this._generateUsersList(),
          msg:        this._TEXTS.users_visibility
        });

        $div.append(user_list_info.render().el);
        this.addView(user_list_info);
      }

      return $div;
    },

    // Add users who won't be able to see the 
    // visualization anymore
    _generateUsersList: function() {
      return this.model.permission.acl.map(function(p) {
        var entity = p.get('entity');
        return {
          id:             entity.get('id'),
          type:           p.get('type'),
          username:       entity.get('username') || entity.get('name'), // organization is name! :S
          avatar_url:     entity.get('avatar_url'),
          visualizations: []
        }
      })
    }


  });