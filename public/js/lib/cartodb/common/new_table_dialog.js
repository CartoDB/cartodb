
/*
var TableSelector = new cdb.core.View.extend({
  events: {
    'click li': 'select'
  },

  select: function() {
  }
});
*/

cdb.admin.CreateTableDialog = cdb.ui.common.Dialog.extend({

  initialize: function() {
    _.extend(this.options, {
              title: 'New table',
              description: '',
              template_name: 'common/views/dialog_base',
              clean_on_hide: true
    });
    this.constructor.__super__.initialize.apply(this);

  },

  render_content: function() {
    var self = this;
    e = $('<div>');
    var uploader = new qq.FileUploader({
      element: e[0],
      action: '/api/v1/uploads',
      onComplete: function(id, fileName, responseJSON){
        console.log(responseJSON);
        var imp = new cdb.admin.Import({
          table_name: 'test',
          file_uri: responseJSON.file_uri
        });
        self.trigger('importStarted', imp);
        imp.save();
        self.hide();
      }
    }); 
    return e;
  },
})
