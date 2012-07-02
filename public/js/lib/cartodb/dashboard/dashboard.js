/**
 *  entry point for dashboard
 */


$(function() {

    var Dashboard = cdb.core.View.extend({
        el: document.body
    });

    var dashboard = new Dashboard();

    // expose to debug
    window.dashboard = dashboard;


    var Settings = cdb.ui.common.Settings.extend();

    var settings = new Settings({
      template_base: $('#settings_template').html(),
      speed: 300
    });

    $('body').append(settings.render().el);

    setTimeout(function(){
      settings.open();  
    },3
});
