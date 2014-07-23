
/**
*  Tables list
*
*  It will show the user tables in a list
*
*  Usage example:
*
*  var tableList = new cdb.admin.dashboard.TableList({
*    el: this.$('#tablelist'),
*    collection: this.tables,
*    user: this.user   // it needs it to know if the user has limitations or not
*  });
*
*/

cdb.admin.dashboard.TableList = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    this.router = this.options.router;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.collection.each(function(table) {
      var table_item = new cdb.admin.dashboard.TableItem({
        model: table,
        user: this.options.user,
        table_options: this.collection.options
      })

      table_item.bind('tagClicked', this._onTagClicked, this);
      table_item.bind('remove', this._onTableRemoved, this);

      this.$el.append(table_item.render().el);
      this.addView(table_item);

    }, this);
  },

  _initBinds: function() {
    this.collection.bind('add remove reset', this.render, this);
  },

  _onTagClicked: function(tag) {
    var onlyMine = this.router.model.get('exclude_shared');
    var path = 'tables' + ( onlyMine ? '/mine' : '' ) + ( '/tag/' + tag );
    this.router.navigate(path, { trigger: true });
  },

  _onTableRemoved: function(mdl, v) {
    this.trigger('onTableRemoved', this);
    mdl.destroy({ wait:true });
  }

});