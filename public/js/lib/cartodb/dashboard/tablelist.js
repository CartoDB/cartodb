
cdb.admin.dashboard = cdb.admin.dashboard || {};

(function() {

  /**
   * dasboard table list item
   */
  var TableView = cdb.core.View.extend({

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table_list_item');
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
    },

    addAll: function() {
      this.render();
    },

    render: function() {
      var self = this;
      self.$el.html('');
      this.model.each(function(m) {
        var li = new TableView({ model: m });
        self.$el.append(li.render().el);
        self.addView(li);
      });
    }

    
  });

  cdb.admin.dashboard.TableList = TableList;

})();
