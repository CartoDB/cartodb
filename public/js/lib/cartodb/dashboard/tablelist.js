
cdb.admin.dashboard = cdb.admin.dashboard || {};

(function() {

  /**
   * dasboard table list item
   */
  var TableView = cdb.core.View.extend({

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));      
      return this;
    }

  });


  /**
   * dasboard table list
   */
  var TableList = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      this.model.bind('reset', this.addAll, this);
      this.model.bind('add', this.addTable, this);
    },

    addAll: function() {
      this.render();
    },

    addTable: function(m) {
      var li = new TableView({ model: m });
      this.$el.append(li.render().el);
      this.addView(li);
    },

    render: function() {
      var self = this;
      this.model.each(function(m) {
        self.addTable(m);
      });
    }

    
  });

  cdb.admin.dashboard.TableList = TableList;

})();
