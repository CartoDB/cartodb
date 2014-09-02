
  /**
   *  Dialog changes within 'New layer dialog'
   *  extends from 'cdb.common.CreateDialog'
   *
   */

  cdb.admin.CreateLayerDialog = cdb.common.CreateDialog.extend({

    render_content: function() {

      var self = this;

      // Render option tabs content (tabs and panes)
      var content = new cdb.admin.CreateLayerDialog.Content({
        model:    this.model,
        user:     this.options.user,
        tabs:     this.options.tabs,
        states:   this.options.states,
        option:   this.options.option,
        uploader: this._UPLOADER,
        $dialog:  this.$el
      });

      this.$('.content').append(content.render().el);

      content.bind('showUpgrade', this._showUpgrade, this);
      content.bind('changeSize', function() {
        setTimeout(function() {
          self.centerInScreen(true);
        }, 300);

      }, this);

      this.addView(content);

      // Render uploader
      var uploader = new cdb.common.CreateDialog.Uploader({
        model:    this.model,
        user:     this.options.user,
        uploader: this._UPLOADER
      })
      this.$('.content').append(uploader.render().el);
      uploader.bind('creationComplete', this._onCreationComplete, this);
      this.addView(uploader);
    }

  });