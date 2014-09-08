
  /**
   *  Table view item por any common data section
   *
   *  - It will dispatch an event to import the data.
   *
   */


  cdb.admin.CommonData.Table = cdb.core.View.extend({

    tagName: 'li',

    _ASSET_URL: 'https://s3.amazonaws.com/common-data.cartodb.net/<%= name %>.zip',

    events: {
      'click h4 a': '_onTableClick'
    },

    initialize: function() {
      _.bindAll(this, '_onTableClick');
      this.template = cdb.templates.getTemplate('common_data/views/common_data_table');
    },

    render: function() {
      this.$el.empty();

      var description_html = this.model.get('description') && $(markdown.toHTML(this.model.get('description'))).addClass('table-description').prop('outerHTML');

      var d = {
        name:         this.model.get('name') || this.model.get('tabname'),
        description:  description_html,
        source:       this.model.get('source') && markdown.toHTML(this.model.get('source')),
        license:      this.model.get('license') && markdown.toHTML(this.model.get('license')),
        size:         this.model.get('size') && this._bytesToSize(this.model.get('size')),
        row_count:    this.model.get('rows') && cdb.Utils.formatNumber(this.model.get('rows')),
        url:          this.model.get('url')
      }

      this.$el.append(this.template( d ));

      return this;
    },

    // Help functions
    _bytesToSize: function(by) {
      var bytes = parseInt(by.toString())
      , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 KB';
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      var value = (bytes / Math.pow(1024, i)).toFixed(2);

      if (value % 1 == 0) {
        value = parseInt(value)
      }
      return value + " " + sizes[i];
    },

    _onTableClick: function(e) {
      if (e) e.preventDefault();
      this.trigger('tableChosen', _.template(this._ASSET_URL)( this.model.attributes ), this);
    }

  });