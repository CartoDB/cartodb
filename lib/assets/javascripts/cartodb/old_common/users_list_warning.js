  
  /**
   * Users list warning view
   *
   *  - It needs a permission or a table model
   *
   */

  cdb.ui.common.UserListWarning = cdb.core.View.extend({

    className: 'common-users-list warning',

    options: {
      list: [],
      msg:  _t('Next users list will be affected by your changes:'),
      type: 'permission'
    },

    initialize: function() {
      this.model = new cdb.core.Model({ list: this.options.list });
      this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('old_common/views/users_list_warning');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$el.empty();

      var template = this.template({
        users: this.model.get('list'),
        msg: this.options.msg
      });
      
      if (this.model.get('list').length === 0) {
        template = '';
      }

      this.$el.append(template);

      // set gradients at top and bottom if it is needed.
      if (this.model.get('list').length > 0) {
        var scroll = new cdb.admin.CustomScrolls({
          parent: this.$('.list-wrapper'),
          el:     this.$('ul')
        });
      }

      return this;
    },

    _initBinds: function() {
      this.model.bind('change:list', this.render, this);
    },

    changeList: function(list) {
      this.model.set('list', list);
    }


  })