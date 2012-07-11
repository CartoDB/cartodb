
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
    //this.content = new TableSelector();
    //return this.content.render().el;

    e = $('<div>');
    var uploader = new qq.FileUploader({
      // pass the dom node (ex. $(selector)[0] for jQuery users)
      element: e[0],
      // path to server-side upload script
      action: '/api/v1/uploads',
      onComplete: function(id, fileName, responseJSON){
        console.log(responseJSON);
        var imp = new cdb.admin.Import({
          table_name: 'test',
          file_uri: responseJSON.file_uri
        });
        imp.save();
        console.log(imp);
      }
    }); 
    return e;
  },
})
