
  /**
   *  Content changes within 'New layer dialog'
   *  extends from 'cdb.common.CreateDialog.Content'
   *
   */


  cdb.admin.CreateLayerDialog.Content = cdb.common.CreateDialog.Content.extend({

    _genActionsController: function() {
      var actions = new cdb.admin.CreateLayerDialog.Actions({
        enabled_tabs: this.enabled_tabs,
        tabs:         this.create_tabs,
        panes:        this.create_panes,
        model:        this.model,
        states:       this.options.states,
        $dialog:      this.$dialog
      });
      this.addView(actions);
    }

  });
  