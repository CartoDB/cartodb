
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
    return 'hola jamon';
  },
})
