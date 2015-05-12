
/**
 *  Change table privacy confirmation window (extends Dialog)
 *
 *
 *  Usage example:
 *
 *  var table_privacy_warning = new cdb.admin.TablePrivacyWarning({
 *    affected_visualizations: affected_visualizations
 *  });
 *
 */

cdb.admin.TablePrivacyWarning = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t("Change table privacy"),
    msg: _t('Your are about to change this table privacy. Please note that if you do it, you will unpublish and turn into private {{ affected }}.'),
    affected: _t('the visualizations below'),
    no_affected: _t('the related visualizations'),
    ok_title: _t("Ok, do it")
  },

  initialize: function() {

    this.options = _.extend({
      title: this._TEXTS.title,
      template_name: 'old_common/views/dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_title,
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'table_privacy_dialog'
    }, this.options);

    this.affected_visualizations = this.options.affected_visualizations;
    this.elder('initialize');
  },

  render_content: function() {

    var $content = $("<div></div>");

    $content.append(
      "<p>" +
      this._TEXTS.msg.replace('{{ affected }}', (this.affected_visualizations && this.affected_visualizations.length>1 ? this._TEXTS.affected : this._TEXTS.no_affected) ) +
      "</p>");
    $content.append("<ul></ul>");
    _.each(this.affected_visualizations, function(vis) {
      if (vis.type != 'table') $content.find("ul").append("<li><a href='" + cdb.config.prefixUrl() + "/viz/" + vis.id + "/' target='_blank'>"+ vis.name +"</a></li>");
    });

    return $content;
  }
});
