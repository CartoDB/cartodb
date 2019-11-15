require 'spec_helper'
require_relative '../../lib/cartodb/trending_maps'

describe CartoDB::TrendingMaps do
  describe 'check for trending maps' do

    before(:all) do
      @api_calls = CartoDB::Stats::APICalls.new
      @trending_maps = CartoDB::TrendingMaps.new
      @default_date_to = Date.today
      @default_date_from = Date.today - CartoDB::TrendingMaps::DAYS_TO_CHECK.days
    end

    it "should mark the map as a trending one" do
      # @api_calls.stubs(:get_api_calls_from_redis).returns({@default_date_to.strftime("%Y%m%d")=>10})
      # @api_calls.stubs(:get_total_api_calls_from_redis).returns(490)
      @trending_maps.is_trending_map?(10, 500).should eq true
    end

    it "should mark the map as a trending one with a greater factor" do
      @trending_maps.is_trending_map?(123, 8034).should eq true
    end

    it "should mark the map as a trending one checking in the bounds" do
      @trending_maps.is_trending_map?(1, 2000).should eq true
    end

    it "should not mark the map as a trending one" do
      @trending_maps.is_trending_map?(123, 7900).should eq false
    end

    it "should not mark the map as a trending one checking the bounds" do
      @trending_maps.is_trending_map?(9, 8010).should eq false
    end

    it "should return 4 trending maps" do
      date = Date.today - 1.days
      date_key = date.strftime("%Y%m%d")
      user = FactoryGirl.build(:user)
      visualization_1 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_1, user)
      add_total_data(visualization_1.id, user.username, 490)
      add_date_data(visualization_1.id, user.username, date_key, 10)
      visualization_2 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_2, user)
      add_total_data(visualization_2.id, user.username, 500)
      add_date_data(visualization_2.id, user.username, date_key, 10)
      visualization_3 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_3, user)
      add_total_data(visualization_3.id, user.username, 1990)
      add_date_data(visualization_3.id, user.username, date_key, 10)
      visualization_4 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_4, user)
      add_total_data(visualization_4.id, user.username, 8300)
      add_date_data(visualization_4.id, user.username, date_key, 20)
      visualization_5 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_5, user)
      add_total_data(visualization_5.id, user.username, 15990)
      add_date_data(visualization_5.id, user.username, date_key, 200)
      visualization_6 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_6, user)
      add_total_data(visualization_6.id, user.username, 7900)
      add_date_data(visualization_6.id, user.username, date_key, 15000)
      visualization_7 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_7, user)
      add_total_data(visualization_7.id, user.username, 0)
      add_date_data(visualization_7.id, user.username, date_key, 0)
      visualization_8 = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      stub_find_visualization(visualization_8, user)
      add_total_data(visualization_8.id, user.username, 10)
      add_date_data(visualization_8.id, user.username, date_key, 1)
      trending_maps = @trending_maps.get_trending_maps
      trending_maps.length.should eq 4
      trending_maps.keys.include?(visualization_1.id).should eq true
      trending_maps.keys.include?(visualization_3.id).should eq true
      trending_maps.keys.include?(visualization_5.id).should eq true
      trending_maps.keys.include?(visualization_6.id).should eq true
    end

    def add_date_data(visualization_id, username, date, value)
      key = build_key(username, visualization_id)
      $users_metadata.ZADD(key, value, date).to_i
      updated_total = $users_metadata.ZSCORE(key, "total").to_f + value.to_f
      $users_metadata.ZADD(key, updated_total, "total").to_i
    end

    def add_total_data(visualization_id, username, value)
      key = build_key(username, visualization_id)
      $users_metadata.ZADD(key, value, "total").to_i
    end

    def build_key(username, visualization_id)
      @api_calls.redis_api_call_key(username, "mapviews", visualization_id)
    end

    def stub_find_visualization(visualization, user)
      Carto::Visualization.stubs("find").with(visualization.id).returns(visualization)
      visualization.stubs("user").returns(user)
    end

  end
end
