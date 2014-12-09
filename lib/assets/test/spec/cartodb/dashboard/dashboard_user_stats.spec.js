describe("cdb.admin.dashboard.UserStats", function() {

  var user_stats;
  var localStorageKey = "test_user_storage_4";

  function generateUserStats(user_data) {

    user_data.api_calls || ( user_data.api_calls = [0] );

    return new cdb.admin.dashboard.UserStats({
      el:               $(".subheader"),
      model:            new cdb.admin.User(user_data),
      router:           new cdb.admin.dashboard.DashboardRouter(),
      tables :          new cdb.admin.Visualizations({ type: 'table' }),
      localStorageKey:  localStorageKey
    });

  }

  afterEach(function() {
    delete localStorage[localStorageKey];
    delete localStorage[localStorageKey + "_closed"];
    $(".subheader").remove();
  });

  beforeEach(function() {

    $("body").append("<div class='subheader'></div>");

    config      = { custom_com_hosted: false };
    upgrade_url = "";

    var user_data = {
      id: 2,
      actions: {
        remove_logo: false,
        private_tables:true},
        username:"staging20",
        account_type:"FREE",

        // Table quota
        table_quota:100,
        table_count:2,

        // Space quota
        quota_in_bytes:314572800,
        remaining_byte_quota:313876480,

        remaining_table_quota:98,

        api_calls:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],
        api_key:"3ee8446970753b2fbdb1df345a2da8a48879ad00",
        layers:[],
        get_layers:true
    };

    user_stats = generateUserStats(user_data);

  });

  describe("UserStats", function() {

    it("should trigger an event when clicking in mapviews progress bar", function() {

      config = { custom_com_hosted: false };
      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 0, table_quota: 10, quota_in_bytes: 10, username: "development" });

      spyOn(user_stats.router, 'navigate');

      user_stats.render();
      $(".mapviews .stats").click();
      expect(user_stats.router.navigate).toHaveBeenCalledWith('visualizations', { trigger: true });

    });

    it("should trigger an event when clicking in tables progress bar", function() {

      config = { custom_com_hosted: false };
      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 0, table_quota: 10, quota_in_bytes: 10, username: "development" });

      spyOn(user_stats.router, 'navigate');
      user_stats.render();
      $(".tables .progress").click();
      expect(user_stats.router.navigate).toHaveBeenCalledWith('tables', { trigger: true });

    });

    it("should hide itself if the user doesn't have tables", function() {

      config = { custom_com_hosted: false };
      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 0, table_quota: 10, quota_in_bytes: 10, username: "development" });
      var spy = spyOn(user_stats, "_deactivate");

      user_stats.render();
      expect(user_stats._deactivate).toHaveBeenCalled();

    });

    it("should show simple graph when user is from an organization", function() {
      var org = new cdb.admin.Organization({ id:10, users: [1,2,3] });
      var user = new cdb.admin.User({ id:3, account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 0, table_quota: 10, quota_in_bytes: 10, username: "development", api_calls: [] });
      user.organization = org;

      var view = new cdb.admin.dashboard.UserStats({
        el:               $(".subheader"),
        model:            user,
        router:           new cdb.admin.dashboard.DashboardRouter(),
        tables :          new cdb.admin.Visualizations({ type: 'table' }),
        localStorageKey:  localStorageKey
      });

      view.render();
      expect(view.$('div.stats').length).toBe(1);
      expect(view.$('.mapviews .progress').length).toBe(0);
    });

    it("should show mapviews when user is and organization admin", function() {
      var org = new cdb.admin.Organization({ id:10, users: [1,2,3], owner: { id:3 }, owner: { id:3 } });
      var user = new cdb.admin.User({ id:3, account_type: "JOHN SNOW", api_calls: [0], remaining_byte_quota: 0, table_count: 0, table_quota: 10, quota_in_bytes: 10, username: "development" });
      user.organization = org;

      var view = new cdb.admin.dashboard.UserStats({
        el:               $(".subheader"),
        model:            user,
        router:           new cdb.admin.dashboard.DashboardRouter(),
        tables :          new cdb.admin.Visualizations({ type: 'table' }),
        localStorageKey:  localStorageKey
      });

      view.render();
      expect(view.$('div.stats').length).toBe(1);
      expect(view.$('.mapviews .progress').length).toBe(0);
    });

  });

  describe("Warnings", function() {

    it("should show the warning message when the user is close to the limits", function() {
      var user_stats = generateUserStats({ migrated: true, account_type: "JOHN SNOW", remaining_byte_quota: 2, table_count: 8, table_quota: 10, quota_in_bytes: 10, username: "development" });
      user_stats.render();
      expect(user_stats.messages.$el.text().replace(/(\r\n|\n|\r)/gm,"")).toEqual('  Hey development, looks like you\'re about to reach your account limit.  Start thinking about upgrading your plan.      x    ');
    });

    it("shouldn't show the warning message if the user is hosting the app", function() {

      config      = { custom_com_hosted: true };
      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 10, table_quota: 10, quota_in_bytes: 10, username: "development" });
      user_stats.render();
      expect(user_stats.messages.$el.text().replace(/(\r\n|\n|\r)/gm,"")).not.toEqual('Hey development, looks like you\'re about to reach your account limit. Start thinking about upgrading your plan.x');
    });

    it("should show the warning message when the user is close to end the trial period", function() {
      var user_stats = generateUserStats({ show_trial_reminder: true, trial_ends_at: "2013-07-21", remaining_byte_quota: 0, account_type: "JOHN SNOW", username: "dev", table_quota: 0, table_count: 2 });

      user_stats.render();
      expect(user_stats.messages.$el.text().replace(/(\r\n|\n|\r)/gm,"")).toEqual('  Just a reminder, your JOHN SNOW trial will finish the next 2013-07-21. Happy mapping!    ');
    });

    it("should show only a warning message when the user is close to the size and table limits", function() {
      var user_stats = generateUserStats({ migrated: true, account_type: "JOHN SNOW", remaining_byte_quota: 0, table_count: 8, table_quota: 10, quota_in_bytes: 10, username: "development" });
      user_stats.render();
      expect(user_stats.messages.$el.find("li").length).toEqual(1);
    });

  });

  describe("Badge", function() {

    it("should set the right badge", function() {
      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 100, username: "development" });
      user_stats.render();

      expect(user_stats.$el.find(".badge i").hasClass("john_snow")).toEqual(true);

      var user_stats = generateUserStats({ account_type: "MAGELLAN", remaining_byte_quota: 100, username: "development" });
      user_stats.render();
      expect(user_stats.$el.find(".badge i").hasClass("magellan")).toEqual(true);

      var user_stats = generateUserStats({ account_type: "JOHN SNOW LUMP-SUM", remaining_byte_quota: 100, username: "development" });
      user_stats.render();

      expect(user_stats.$el.find(".badge i").hasClass("john_snow")).toEqual(true);

      var user_stats = generateUserStats({ account_type: "ACADEMIC", remaining_byte_quota: 100, username: "development" });
      user_stats.render();

      expect(user_stats.$el.find(".badge i").hasClass("default")).toEqual(true);

      var user_stats = generateUserStats({ account_type: "ACADEMY", remaining_byte_quota: 100, username: "development" });
      user_stats.render();
      expect(user_stats.$el.find(".badge i").hasClass("default")).toEqual(true);

      var user_stats = generateUserStats({ account_type: "ENTERPRISE", remaining_byte_quota: 100, username: "development" });
      user_stats.model.organization = new cdb.admin.Organization({ id:1, users: [1,2,3] });
      user_stats.render();
      expect(user_stats.$(".badge i").hasClass("enterprise")).toEqual(true);
      expect(user_stats.$(".badge i").text()).toEqual('ENTERPRISE');

    });

    it("should allow to choose badges", function() {

      var user_stats = generateUserStats({ account_type: "JOHN SNOW", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("john_snow");

      var user_stats = generateUserStats({ account_type: "ACADEMIC JOHN SNOW", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("john_snow");

      var user_stats = generateUserStats({ account_type: "ACADEMIC", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("default");

      var user_stats = generateUserStats({ account_type: "ACADEMY", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("default");

      var user_stats = generateUserStats({ account_type: "S LUMP-SUM", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("dedicated");

      var user_stats = generateUserStats({ account_type: "DEDICATED", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("dedicated");

      var user_stats = generateUserStats({ account_type: "XS", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("dedicated");

      var user_stats = generateUserStats({ account_type: "JOHN SNOW ACADEMIC YEARLY", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("john_snow");

      var user_stats = generateUserStats({ account_type: "ECOHACK", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("default");

      var user_stats = generateUserStats({ account_type: "FREE", remaining_byte_quota: 100, username: "development" });
      expect(user_stats._chooseBadge()).toEqual("free");

    });

  });
  describe("Graphs", function() {

    it("should generate the mapviews graphs", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, api_calls_quota: 1000, api_calls: [0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], remaining_byte_quota: 100, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .mapviews p").text()).toEqual('13 map views this month');
    });

    it("should generate the mapviews graphs", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, api_calls_quota: 50000, api_calls: [10000,500], remaining_byte_quota: 100, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();
      expect(user_stats.$el.find("section.stats .mapviews p").text()).toEqual('10.5K map views this month');

      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, api_calls_quota: 500000, api_calls: [50], remaining_byte_quota: 100, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();
      expect(user_stats.$el.find("section.stats .mapviews p").text()).toEqual('50 map views this month');

      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, remaining_byte_quota: 100, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();
      expect(user_stats.$el.find("section.stats .tables p").text()).toEqual('91 of 100 tables created');
    });

    it("should generate the table graphs (for infinite)", function() {
      var user_stats = generateUserStats({ table_quota: null, table_count: 91, remaining_byte_quota: 100, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .tables p").text()).toEqual('91 of ∞ tables created');
    });

    it("should generate the space graphs", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, quota_in_bytes: 100, remaining_byte_quota: 5, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .size p").text()).toEqual('95.0 of 100.0 used bytes');
    });

    it("should generate the space graphs (for unlimited)", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, quota_in_bytes: null, remaining_byte_quota: 5, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .size p").text()).toEqual('You have ∞ space');
    });

    it("should generate the size graphs (in megabytes)", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, quota_in_bytes: 524288000*2, remaining_byte_quota: 524288000, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .size p").text()).toEqual('500.0 of 1000.0 used megabytes');
    });

    it("should generate the size graphs (in gigabytes)", function() {
      var GB = 1073741824;
      var user_stats = generateUserStats({ table_quota: 100, table_count: 91, quota_in_bytes: 5*GB, remaining_byte_quota: 2*GB, account_type: "JOHN SNOW", username: "development" });
      user_stats.render();

      expect(user_stats.$el.find("section.stats .size p").text()).toEqual('3.0 of 5.0 used gigabytes');
    });

  });

  describe("table quota", function() {

    it("should generate the table quota status message", function() {
      var user_stats = generateUserStats({ remaining_byte_quota: 0, account_type: "FREE", username: "dev", table_quota: 100, table_count: 2 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual('');
    });

    it("should generate the table quota status message for users withouth quota", function() {
      var user_stats = generateUserStats({ remaining_byte_quota: 0, account_type: "FREE", username: "dev",table_quota: 0, table_count: 2 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual('green');
    });

    it("should generate the table quota status message when the user is about to reach the limit", function() {
      var user_stats = generateUserStats({ remaining_byte_quota: 0, account_type: "FREE", username: "dev",table_quota: 100, table_count: 80 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual("danger");
      expect(user_stats.model.get("limits_tables_exceeded")).toEqual("tables");
    });

    it("should generate the table quota status message when the user reached the limit", function() {
      var user_stats = generateUserStats({ remaining_byte_quota: 0, account_type: "FREE", username: "dev",table_quota: 100, table_count: 100 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual("boom");
      expect(user_stats.model.get("limits_tables_exceeded")).toEqual("tables");
    });

  });

  describe("space quota", function() {

    it("should generate the space quota status message", function() {
      var user_stats = generateUserStats({ account_type: "FREE", username: "dev", quota_in_bytes: 100, remaining_byte_quota: 2000 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('');
    });

    it("should generate the space quota status message for users withouth quota", function() {
      var user_stats = generateUserStats({ account_type: "FREE", username: "dev", quota_in_bytes: 0, remaining_byte_quota: 23432322 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('green');
    });

    it("should generate the space quota status message when the user is about to reach the limit", function() {
      var user_stats = generateUserStats({ account_type: "FREE", username: "dev", quota_in_bytes: 100, remaining_byte_quota: 20 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('danger');
      expect(user_stats.model.get("limits_space_exceeded")).toEqual("space");
    });

    it("should generate the space quota status message when the user reached the limit", function() {
      var user_stats = generateUserStats({ account_type: "FREE", username: "dev", quota_in_bytes: 100, remaining_byte_quota: 0 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('boom');
      expect(user_stats.model.get("limits_space_exceeded")).toEqual("space");
    });

  });

  describe("mapviews quota", function() {

    // it("should generate the mapviews quota status message", function() {
    //   var user_stats = generateUserStats({ remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 1000, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual('');
    // });

    // it("should generate the mapviews quota status message for users withouth quota", function() {
    //   var user_stats = generateUserStats({ remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 0, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual('green');
    // });

    // it("should generate the mapviews quota status message when the user is about to reach the limit", function() {
    //   var user_stats = generateUserStats({ remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 100, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual("danger");
    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual("mapviews");
    // });

    // it("should generate the mapviews quota status message when a FREE user reached the limit", function() {
    //   var user_stats = generateUserStats({ billing_period: "2014-06-18", api_calls_block_price: 100, remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 80, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   user_stats.messages.render();

    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual("boom");
    //   expect(user_stats.messages.messages.length).toEqual(1);
    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual("mapviews");

    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual("mapviews");
    //   expect(user_stats.messages.$el.find(".limits_mapviews_exceeded").html().replace(/(\r\n|\n|\r)/gm,"")).toEqual('<div class="inner">  <p>  Your map views for the month are over limit. Your billing month restarts on 2014-06-18. Please add your billing info as soon as possible to avoid a stop in your service. For all FREE accounts, map views over the first 50,000 cost $0.20 per 1000. If you need help or have questions, <a href="mailto:support@cartodb.com">contact us</a>.</p>      <a href="#/close" class="smaller close">x</a>    </div>');
    // });

    // it("should generate the mapviews quota status message when a PAID user reached the limit", function() {
    //   var user_stats = generateUserStats({ api_calls_block_price: 100, remaining_byte_quota: 100, account_type: "Magellan", username: "dev", api_calls_quota: 80, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual("boom");
    //   expect(user_stats.messages.messages.length).toEqual(1);
    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual("mapviews");
    //   expect(user_stats.messages.$el.find(".limits_mapviews_exceeded").html().replace(/(\r\n|\n|\r)/gm,"")).toEqual('<div class="inner">  <p>Hey <strong>dev</strong>, you\'re over your map view limit, your current overage quota is $1 for every 1000 extra requests.<br>Start thinking about <a href="?utm_source=Dashboard_Limits_Reached&amp;utm_medium=referral&amp;utm_campaign= Upgrade_from_Dashboard&amp;utm_content=upgrading%20your%20plan" class="underline">upgrading your plan</a>.</p>      <a href="#/close" class="smaller close">x</a>    </div>');

    // });

    // it("shouldn't show the mapviews_quota_status message if the api_calls_block_price is null", function() {
    //   var user_stats = generateUserStats({ api_calls_block_price: null, remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 80, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual("boom");
    //   expect(user_stats.messages.messages.length).toEqual(0);
    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual(undefined);
    // });

    // it("shouldn't show the mapviews_quota_status message if the api_calls_block_price is zero", function() {
    //   var user_stats = generateUserStats({ api_calls_block_price: null, remaining_byte_quota: 100, account_type: "FREE", username: "dev", api_calls_quota: 80, api_calls: [0, 0, 40, 0, 40] });
    //   user_stats._calculateQuotas();
    //   expect(user_stats.model.get("mapviews_quota_status")).toEqual("boom");
    //   expect(user_stats.messages.messages.length).toEqual(0);
    //   expect(user_stats.model.get("limits_mapviews_exceeded")).toEqual(undefined);
    // });

  });

});
