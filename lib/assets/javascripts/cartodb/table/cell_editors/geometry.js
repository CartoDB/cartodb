cdb.admin.EditGeometryDialog = cdb.admin.SmallDialog.extend({

  events: cdb.core.View.extendEvents({
    'keydown input': '_keyPress'
  }),

  initialize: function() {
    var self = this;
    _.extend(this.options, {
      template_name: 'common/views/dialog_small_edit',
      title: '',
      description: '',
      clean_on_hide: true
    });
    
    cdb.ui.common.Dialog.prototype.initialize.apply(this);
    this.render();
    $(document.body).find("div.table table").append(this.el);

    
    this.$el.addClass('edit_text_dialog');
    this.input = self.$('textarea');
    self.input.attr('disabled', 'disabled');
    var the_geom = self.options.row.get('the_geom') || '';
    this.options.row.bind('change', function() {
        self.input.val(the_geom);
        self.input.removeAttr('disabled');
    }, this);
    this.options.row.fetch();
    this.add_related_model(this.options.row);
  },

  render_content: function() {
    // render loading if the GeoJSON is not loaded
    var geojson = this.options.row.get('the_geom');
    geojson = this.options.row.isGeomLoaded() ?
      geojson || '' :
      'loading...';

    return '<textarea placeholder="">' + geojson + '</textarea>';
  },

  _keyPress: function(e) {
    if(e.keyCode === 13) {
      this._ok();
    }
  },

  ok: function() {
    if(this.options.res) {
      this.options.res(this.input.val());
    }
  }
});