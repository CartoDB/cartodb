
  /**
   * Mamufas drag for the dashboard
   */
   
  cdb.admin.MamufasDrag = cdb.core.View.extend({

    initialize: function() {
      var self = this;

      _.bindAll(this, "_onDrop", "_onDragOver", "_onDragStart", "_onMouseLeave", "enable", "disable");

      this.$upload = this.$el;
      this.inside_drop = false;

      $(document).bind("dragstart", function(ev){ self.inside_drop = true });
      $(document).bind("mouseleave mouseout dragexit", this._onMouseLeave);

      this.$upload.fileupload({
        drop: this._onDrop,
        dragover: this._onDragOver
      });
    },

    _onDrop: function(ev,files_obj) {
      this.inside_drop = false;
      if (files_obj.files && files_obj.files.length > 0) {
        this.trigger("drop",ev,files_obj);
      } else {
        ev.preventDefault();
        ev.stopPropagation();
      }
      this.$upload.fadeOut('fast');
    },

    _onDragStart: function() {
      this.inside_drop = true ;
    },

    _onDragOver: function(ev) {
      if (!this.inside_drop) {
        this.$upload.fadeIn('fast');
      }
    },

    _onMouseLeave: function() {
      this.inside_drop = false;
      this.$upload.fadeOut('fast');
    },

    enable: function() {
      this.$upload.fileupload("enable")
    },

    disable: function() {
      this.$upload.fileupload('disable');
    }
  });

