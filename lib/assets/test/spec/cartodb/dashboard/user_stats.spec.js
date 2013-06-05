describe("UserStats", function() {

  var user_stats;

  function generateUserStats(user_data) {

    return new cdb.admin.dashboard.UserStats({
      el:    $("body"),
      model: new cdb.admin.User(user_data)
    });

  }

  beforeEach(function() {

    config = { custom_hosted: false };

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
        byte_quota:314572800,
        remaining_byte_quota:313876480,

        remaining_table_quota:98,

        api_calls:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],
        api_key:"3ee8446970753b2fbdb1df345a2da8a48879ad00",
        layers:[],
        get_layers:true
    };

    user_stats = generateUserStats(user_data);


  });

  describe("Graphs", function() {

    it("should generate the table graphs", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 2 });
      user_stats.render();
      console.log(user_stats.$el.find("section.stats .tables"));
      expect(user_stats.$el.find("section.stats .tables").text()).toEqual('2 of 100 tables created');
    });


  });

  describe("table quota", function() {

    it("should generate the table quota status message", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 2 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual('');
    });

    it("should generate the table quota status message for users withouth quota", function() {
      var user_stats = generateUserStats({ table_quota: 0, table_count: 2 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual('green');
    });

    it("should generate the table quota status message when the user is about to reach the limit", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 80 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual("danger");
    });

    it("should generate the table quota status message when the user reached the limit", function() {
      var user_stats = generateUserStats({ table_quota: 100, table_count: 100 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("table_quota_status")).toEqual("boom");
    });

  });

  describe("space quota", function() {

    it("should generate the space quota status message", function() {
      var user_stats = generateUserStats({ byte_quota: 100, remaining_byte_quota: 2000 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('');
    });

    it("should generate the space quota status message for users withouth quota", function() {
      var user_stats = generateUserStats({ byte_quota: 0, remaining_byte_quota: 23432322 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('green');
    });

    it("should generate the space quota status message when the user is about to reach the limit", function() {
      var user_stats = generateUserStats({ byte_quota: 100, remaining_byte_quota: 20 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('danger');
    });

    it("should generate the space quota status message when the user reached the limit", function() {
      var user_stats = generateUserStats({ byte_quota: 100, remaining_byte_quota: 0 });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("byte_quota_status")).toEqual('boom');
    });

  });

  describe("mapviews quota", function() {

    it("should generate the mapviews quota status message", function() {
      var user_stats = generateUserStats({ api_calls_quota: 1000, api_calls: [0, 0, 40, 0, 40] });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("mapviews_quota_status")).toEqual('');
    });

    it("should generate the mapviews quota status message for users withouth quota", function() {
      var user_stats = generateUserStats({ api_calls_quota: 0, api_calls: [0, 0, 40, 0, 40] });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("mapviews_quota_status")).toEqual('green');
    });

    it("should generate the mapviews quota status message when the user is about to reach the limit", function() {
      var user_stats = generateUserStats({ api_calls_quota: 100, api_calls: [0, 0, 40, 0, 40] });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("mapviews_quota_status")).toEqual("danger");
    });

    it("should generate the mapviews quota status message when the user reached the limit", function() {
      var user_stats = generateUserStats({ api_calls_quota: 80, api_calls: [0, 0, 40, 0, 40] });
      user_stats._calculateQuotas();
      expect(user_stats.model.get("mapviews_quota_status")).toEqual("boom");
    });

  });

});
