require 'spec_helper'
require_relative '../../lib/cartodb/stats/api_calls'

describe CartoDB::Stats::APICalls do
  describe "Stats API Calls" do
    before(:all) do
      @api_calls = CartoDB::Stats::APICalls.new
    end

    it "should sum correctly api calls from all sources and return array without date" do
      redis_sources_count = @api_calls.REDIS_SOURCES.length
      @api_calls.stubs(:get_old_api_calls).returns({
        "per_day" => [0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 17, 4, 0, 0, 0, 0],
        "total"=>49,
        "updated_at"=>1370362756
      })
      @user.stubs(:get_es_api_calls_from_redis).returns([
        21, 0, 0, 0, 2, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ])
      @user.get_api_calls.should == [21, 0, 0, 0, 6, 17, 0, 5, 0, 0, 0, 0, 0, 0, 8, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0]
      @user.get_api_calls(
        from: (Date.today - 6.days),
        to: Date.today
      ).should == [21, 0, 0, 0, 6, 17, 0]
    end

      

    end
    it "should prefix all hash keys with import_ except username, distinct_id and account_Type for Mixpanel" do
      metrics = CartoDB::Metrics.new
      metrics.mixpanel_payload(:import, {username: "asdf", account_type: "Godzilla", error: 3, extension: 34, distinct_id: "aasdf"})
        .should == {username: "asdf", account_type: "Godzilla", import_error: 3, import_extension: 34, distinct_id: "aasdf"}

    end
  end
end
