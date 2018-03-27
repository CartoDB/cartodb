# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::RateLimit do
  include CartoDB::Factories

  before :each do
    @limits_feature_flag = FactoryGirl.create(:feature_flag, name: 'limits_v2', restricted: false)
    User.any_instance.stubs(:save_rate_limits).returns(true)
    @user = FactoryGirl.create(:valid_user)
    @rate_limit = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([0, 1, 2]),
                                           maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                           maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                           maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                           maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                           maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                           maps_tile: Carto::RateLimitValues.new([1, 2, 17, 30, 32, 34]),
                                           maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                           maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                           maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                           maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                           maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                           maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                           maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                           maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                           maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                           sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                           sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                           sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                           sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                           sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
  end

  after :each do
    User.any_instance.unstub(:save_rate_limits)
    @user.destroy if @user
    @rate_limit.destroy if @rate_limit
    @rate_limit2.destroy if @rate_limit2
    @limits_feature_flag.destroy
  end

  describe '#CRUD' do
    it 'is persisted correctly to database' do
      rate_limit = Carto::RateLimit.find(@rate_limit.id)

      rate_limit.maps_anonymous.first.max_burst.should eq 0
      rate_limit.maps_anonymous.first.count_per_period.should eq 1
      rate_limit.maps_anonymous.first.period.should eq 2

      rate_limit.maps_anonymous.first.to_array.should eq [0, 1, 2]
      rate_limit.maps_static.first.to_array.should eq [3, 4, 5]
      rate_limit.maps_static_named.first.to_array.should eq [6, 7, 8]
      rate_limit.maps_dataview.first.to_array.should eq [9, 10, 11]
      rate_limit.maps_dataview_search.first.to_array.should eq [12, 13, 14]
      rate_limit.maps_analysis.first.to_array.should eq [18, 19, 20]

      rate_limit.maps_tile.length.should eq 2
      rate_limit.maps_tile.to_redis_array.should eq [1, 2, 17, 30, 32, 34]

      rate_limit.maps_attributes.first.to_array.should eq [21, 22, 23]
      rate_limit.maps_named_list.first.to_array.should eq [24, 25, 26]
      rate_limit.maps_named_create.first.to_array.should eq [27, 28, 29]
      rate_limit.maps_named_get.first.to_array.should eq [30, 31, 32]
      rate_limit.maps_named.first.to_array.should eq [33, 34, 35]
      rate_limit.maps_named_update.first.to_array.should eq [36, 37, 38]
      rate_limit.maps_named_delete.first.to_array.should eq [39, 40, 41]
      rate_limit.maps_named_tiles.first.to_array.should eq [10, 11, 12]
      rate_limit.maps_analysis_catalog.first.to_array.should eq [10, 11, 12]
      rate_limit.sql_query.first.to_array.should eq [13, 14, 15]
      rate_limit.sql_query_format.first.to_array.should eq [16, 17, 18]
      rate_limit.sql_job_create.first.to_array.should eq [19, 110, 111]
      rate_limit.sql_job_get.first.to_array.should eq [6, 7, 8]
      rate_limit.sql_job_delete.first.to_array.should eq [0, 1, 2]
    end

    it 'updates a rate_limit' do
      rate_limit = Carto::RateLimit.find(@rate_limit.id)

      rate_limit.maps_anonymous.first.max_burst = 1
      rate_limit.maps_anonymous.first.count_per_period = 2
      rate_limit.maps_anonymous.first.period = 3

      rate_limit.maps_tile.each do |r|
        r.max_burst += 1
        r.count_per_period += 1
        r.period += 1
      end

      rate_limit.save

      rate_limit = Carto::RateLimit.find(@rate_limit.id)

      rate_limit.maps_anonymous.first.max_burst.should eq 1
      rate_limit.maps_anonymous.first.count_per_period.should eq 2
      rate_limit.maps_anonymous.first.period.should eq 3

      rate_limit.maps_tile.first.max_burst.should eq 2
      rate_limit.maps_tile.first.count_per_period.should eq 3
      rate_limit.maps_tile.first.period.should eq 18

      rate_limit.maps_tile.second.max_burst.should eq 31
      rate_limit.maps_tile.second.count_per_period.should eq 33
      rate_limit.maps_tile.second.period.should eq 35
    end

    it 'updates a rate_limit to redis' do
      User.any_instance.unstub(:save_rate_limits)
      map_prefix = "limits:rate:store:#{@user.username}:maps:"

      @user.rate_limit_id = @rate_limit.id
      @user.save

      $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["0", "1", "2"]

      @rate_limit.maps_anonymous.first.max_burst = 1
      @rate_limit.maps_anonymous.first.count_per_period = 2
      @rate_limit.maps_anonymous.first.period = 3

      @rate_limit.save
      @rate_limit.save_to_redis(@user)

      $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["1", "2", "3"]
    end

    it 'is persisted correctly to redis' do
      map_prefix = "limits:rate:store:#{@user.username}:maps:"
      sql_prefix = "limits:rate:store:#{@user.username}:sql:"

      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}static").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}static_named").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}dataview").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}dataview_search").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}analysis").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}tile").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}attributes").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_list").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_create").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_get").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_update").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_delete").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}named_tiles").should eq 0
      $limits_metadata.EXISTS("#{map_prefix}analysis_catalog").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}query").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}query_format").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}job_create").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}job_get").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}job_delete").should eq 0

      @rate_limit.save_to_redis(@user)

      $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["0", "1", "2"]
      $limits_metadata.LRANGE("#{map_prefix}static", 0, 2).should == ["3", "4", "5"]
      $limits_metadata.LRANGE("#{map_prefix}static_named", 0, 2).should == ["6", "7", "8"]
      $limits_metadata.LRANGE("#{map_prefix}dataview", 0, 2).should == ["9", "10", "11"]
      $limits_metadata.LRANGE("#{map_prefix}dataview_search", 0, 2).should == ["12", "13", "14"]
      $limits_metadata.LRANGE("#{map_prefix}analysis", 0, 2).should == ["18", "19", "20"]
      $limits_metadata.LRANGE("#{map_prefix}tile", 0, 5).should == ["1", "2", "17", "30", "32", "34"]
      $limits_metadata.LRANGE("#{map_prefix}attributes", 0, 2).should == ["21", "22", "23"]
      $limits_metadata.LRANGE("#{map_prefix}named_list", 0, 2).should == ["24", "25", "26"]
      $limits_metadata.LRANGE("#{map_prefix}named_create", 0, 2).should == ["27", "28", "29"]
      $limits_metadata.LRANGE("#{map_prefix}named_get", 0, 2).should == ["30", "31", "32"]
      $limits_metadata.LRANGE("#{map_prefix}named", 0, 2).should == ["33", "34", "35"]
      $limits_metadata.LRANGE("#{map_prefix}named_update", 0, 2).should == ["36", "37", "38"]
      $limits_metadata.LRANGE("#{map_prefix}named_delete", 0, 2).should == ["39", "40", "41"]
      $limits_metadata.LRANGE("#{map_prefix}named_tiles", 0, 2).should == ["10", "11", "12"]
      $limits_metadata.LRANGE("#{map_prefix}analysis_catalog", 0, 2).should == ["10", "11", "12"]
      $limits_metadata.LRANGE("#{sql_prefix}query", 0, 2).should == ["13", "14", "15"]
      $limits_metadata.LRANGE("#{sql_prefix}query_format", 0, 2).should == ["16", "17", "18"]
      $limits_metadata.LRANGE("#{sql_prefix}job_create", 0, 2).should == ["19", "110", "111"]
      $limits_metadata.LRANGE("#{sql_prefix}job_get", 0, 2).should == ["6", "7", "8"]
      $limits_metadata.LRANGE("#{sql_prefix}job_delete", 0, 2).should == ["0", "1", "2"]

      @rate_limit.maps_static.first.max_burst = 4
      @rate_limit.save_to_redis(@user)
      $limits_metadata.LRANGE("#{map_prefix}static", 0, 2).should == ["4", "4", "5"]
    end

    it 'is removed correctly from redis' do
      map_prefix = "limits:rate:store:#{@user.username}:maps:"

      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 0

      @rate_limit.save_to_redis(@user)

      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 1

      @rate_limit.destroy_completely(@user)

      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 0

      expect {
        Carto::RateLimit.find(@rate_limit.id)
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'cannot crate a rate_limit with wrong number of rate limits' do
      expect {
        Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([0, 1]),
                                 maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                 maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                 maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                 maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                 maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                 maps_tile: Carto::RateLimitValues.new([1, 2, 17, 30, 32, 34]),
                                 maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                 maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                 maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                 maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                 maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                 maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                 maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                 maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                 maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                 sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                 sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                 sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                 sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                 sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
      }.to raise_error(/Error: Number of rate limits needs to be multiple of three/)

      expect {
        Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([0, 1, 2]),
                                 maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                 maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                 maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                 maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                 maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                 maps_tile: Carto::RateLimitValues.new([1, 2, 17, 30]),
                                 maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                 maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                 maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                 maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                 maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                 maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                 maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                 maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                 maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                 sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                 sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                 sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                 sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                 sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
      }.to raise_error(/Error: Number of rate limits needs to be multiple of three/)
    end

    it 'raises error if endpoint is set to nil or does not exist' do
      expect {
        @rate_limit2 = Carto::RateLimit.create!(maps_anonymous: nil,
                                                maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                                maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                                maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                                maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                                maps_tile: Carto::RateLimitValues.new([1, 2, 17]),
                                                maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                                maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                                maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                                maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                                maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                                maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                                maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                                maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                                maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                                sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                                sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                                sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                                sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                                sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'raises error if any endpoint values are empty' do
      expect {
        @rate_limit2 = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([]),
                                                maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                                maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                                maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                                maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                                maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                                maps_tile: Carto::RateLimitValues.new([1, 2, 17]),
                                                maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                                maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                                maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                                maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                                maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                                maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                                maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                                maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                                maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                                sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                                sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                                sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                                sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                                sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'raises error if any endpoint values are empty' do
      rate_limit_not_saved = Carto::RateLimit.new(maps_anonymous: Carto::RateLimitValues.new([]),
                                                  maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                                  maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                                  maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                                  maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                                  maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                                  maps_tile: Carto::RateLimitValues.new([1, 2, 17]),
                                                  maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                                  maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                                  maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                                  maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                                  maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                                  maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                                  maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                                  maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                                  maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                                  sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                                  sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                                  sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                                  sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                                  sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))
      expect {
        rate_limit_not_saved.save_to_redis(@user)
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'compares the same rate limit instance' do
      @rate_limit.should eq @rate_limit
    end

    it 'compares two different rate limits attributes' do
      @rate_limit2 = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([1, 1, 2]),
                                              maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                              maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                              maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                              maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                              maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                              maps_tile: Carto::RateLimitValues.new([1, 2, 17, 30, 32, 34]),
                                              maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                              maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                              maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                              maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                              maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                              maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                              maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                              maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                              maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                              sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                              sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                              sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                              sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                              sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))

      @rate_limit.should_not eq @rate_limit2
    end

    it 'compares two different rate limits with same attributes' do
      @rate_limit2 = Carto::RateLimit.create!(maps_anonymous: Carto::RateLimitValues.new([0, 1, 2]),
                                              maps_static: Carto::RateLimitValues.new([3, 4, 5]),
                                              maps_static_named: Carto::RateLimitValues.new([6, 7, 8]),
                                              maps_dataview: Carto::RateLimitValues.new([9, 10, 11]),
                                              maps_dataview_search: Carto::RateLimitValues.new([12, 13, 14]),
                                              maps_analysis: Carto::RateLimitValues.new([18, 19, 20]),
                                              maps_tile: Carto::RateLimitValues.new([1, 2, 17, 30, 32, 34]),
                                              maps_attributes: Carto::RateLimitValues.new([21, 22, 23]),
                                              maps_named_list: Carto::RateLimitValues.new([24, 25, 26]),
                                              maps_named_create: Carto::RateLimitValues.new([27, 28, 29]),
                                              maps_named_get: Carto::RateLimitValues.new([30, 31, 32]),
                                              maps_named: Carto::RateLimitValues.new([33, 34, 35]),
                                              maps_named_update: Carto::RateLimitValues.new([36, 37, 38]),
                                              maps_named_delete: Carto::RateLimitValues.new([39, 40, 41]),
                                              maps_named_tiles: Carto::RateLimitValues.new([10, 11, 12]),
                                              maps_analysis_catalog: Carto::RateLimitValues.new([10, 11, 12]),
                                              sql_query: Carto::RateLimitValues.new([13, 14, 15]),
                                              sql_query_format: Carto::RateLimitValues.new([16, 17, 18]),
                                              sql_job_create: Carto::RateLimitValues.new([19, 110, 111]),
                                              sql_job_get: Carto::RateLimitValues.new([6, 7, 8]),
                                              sql_job_delete: Carto::RateLimitValues.new([0, 1, 2]))

      @rate_limit.should eq @rate_limit2
    end
  end
end
