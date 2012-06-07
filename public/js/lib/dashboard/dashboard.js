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
});
