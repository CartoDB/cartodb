
  /**
   *  Big loader for table and visualization view
   */

  cdb.admin.TableBigLoader = cdb.admin.BaseDialog.extend({

    events: {},

    _TEXTS: {
      loader: _t("Setting <%- type %>...")
    },

    initialize: function() {
      _.extend(this.options, {
        clean_on_hide: false,
        template_name: 'table/views/base_table_big_loader',
        modal_class: "table_big_loader"
      });
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.template = cdb.templates.getTemplate('table/views/table_big_loader');
      $content.append(this.template(this.options));

      // Hide mamufas
      this.$('.mamufas').hide();

      return $content;
    },

    change: function(type) {
      this.$('.loader p').text(this._TEXTS.loader.replace("<%- type %>", type));
    }
  })