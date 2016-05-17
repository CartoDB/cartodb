# encoding: UTF-8

require 'mock_redis'
require 'active_support/time'
require_relative '../spec_helper'
require_relative '../../services/dataservices-metrics/lib/geocoder_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/observatory_snapshot_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/observatory_general_usage_metrics'

# Tests should define the following method:
# - `get_twitter_imports_count_by_user_id`
# - `get_user_by_id`
shared_examples_for "user models" do
  describe '#get_twitter_imports_count' do
    include_context 'users helper'

    it "should count tweet imports" do
      FactoryGirl.create(:search_tweet, user: @user1, retrieved_items: 5)

      FactoryGirl.create(:search_tweet, user: @user2, retrieved_items: 6)

      get_twitter_imports_count_by_user_id(@user1.id).should == 5
    end
  end

  describe 'twitter_datasource_enabled for org users' do
    include_context 'organization with users helper'

    it 'is enabled if organization has it enabled, no matter whether user has it or not,
        and enabled if he has it enabled, no matter whether org has it or not' do
      @organization.twitter_datasource_enabled = false
      @organization.save.reload

      @org_user_1.twitter_datasource_enabled = false
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == false

      @organization.twitter_datasource_enabled = true
      @organization.save.reload

      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true

      @org_user_1.twitter_datasource_enabled = true
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true

      @organization.twitter_datasource_enabled = false
      @organization.save.reload

      @org_user_1.twitter_datasource_enabled = true
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true
    end
  end

  describe 'User#remaining_geocoding_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    it 'calculates the remaining quota for a non-org user correctly' do
      @user1.geocoding_quota = 500
      @user1.save
      Geocoding.new(kind: 'high-resolution',
                    user: @user1,
                    formatter: '{dummy}',
                    processed_rows: 100).save

      get_user_by_id(@user1.id).remaining_geocoding_quota.should == 400
    end

    it 'takes into account geocodings performed by the org users #4033' do
      @organization.geocoding_quota = 500
      @organization.save.reload

      Geocoding.new(kind: 'high-resolution',
                    user: @org_user_1,
                    formatter: '{dummy}',
                    processed_rows: 100).save

      Geocoding.new(kind: 'high-resolution',
                    user: @org_user_2,
                    formatter: '{dummy}',
                    processed_rows: 100).save

      get_user_by_id(@org_user_1.id).remaining_geocoding_quota.should == 300
      get_user_by_id(@org_user_2.id).remaining_geocoding_quota.should == 300
    end
  end

  describe 'User#used_geocoding_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      @user1.geocoding_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.geocoding_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the used geocoder quota in the current billing cycle' do
      usage_metrics = CartoDB::GeocoderUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics)
      Geocoding.new(kind: 'high-resolution',
                    user: @user1,
                    formatter: '{dummy}',
                    processed_rows: 0,
                    cache_hits: 100,
                    created_at: (DateTime.current - 1)).save
      Geocoding.new(kind: 'high-resolution',
                    user: @user1,
                    formatter: '{dummy}',
                    processed_rows: 100,
                    cache_hits: 0,
                    created_at: (DateTime.current - 2)).save
      Geocoding.new(kind: 'high-resolution',
                    user: @user1,
                    formatter: '{dummy}',
                    processed_rows: 10,
                    cache_hits: 0,
                    created_at: DateTime.current).save
      usage_metrics.incr(:geocoder_here, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:geocoder_here, :success_responses, 100, (DateTime.current - 2))
      usage_metrics.incr(:geocoder_cache, :success_responses, 100, (DateTime.current - 1))

      get_user_by_id(@user1.id).get_new_system_geocoding_calls.should == 210
      get_user_by_id(@user1.id).get_geocoding_calls.should == 210
    end

    it 'calculates the used geocoding quota for an organization' do
      usage_metrics_1 = CartoDB::GeocoderUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::GeocoderUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      # We are going to get the organization data show we could use both usage_metrics objects
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics_1)
      Geocoding.new(kind: 'high-resolution',
                    user: @org_user_1,
                    formatter: '{dummy}',
                    processed_rows: 100,
                    created_at: DateTime.current).save

      Geocoding.new(kind: 'high-resolution',
                    user: @org_user_2,
                    formatter: '{dummy}',
                    processed_rows: 120,
                    cache_hits: 10,
                    created_at: DateTime.current - 1).save

      usage_metrics_1.incr(:geocoder_here, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:geocoder_here, :success_responses, 120, DateTime.current - 1)
      usage_metrics_2.incr(:geocoder_cache, :success_responses, 10, DateTime.current - 1)

      @organization.get_new_system_geocoding_calls.should == 230
    end

    it 'calculates the used geocoder quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::GeocoderUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:geocoder_here, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:geocoder_here, :success_responses, 100, (DateTime.current - 2))
      usage_metrics.incr(:geocoder_here, :empty_responses, 10, (DateTime.current - 2))
      usage_metrics.incr(:geocoder_cache, :success_responses, 100, (DateTime.current - 1))

      get_user_by_id(@user1.id).get_new_system_geocoding_calls.should == 220
    end
  end

  describe 'User#remaining here isolines quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      @user1.here_isolines_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.here_isolines_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::HereIsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, DateTime.current)

      @user1.remaining_here_isolines_quota.should == 400
    end

    it 'takes into account here isoline requests performed by the org users' do
      usage_metrics_1 = CartoDB::HereIsolinesUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::HereIsolinesUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:here_isolines, :isolines_generated, 100, DateTime.current)
      usage_metrics_2.incr(:here_isolines, :isolines_generated, 100, DateTime.current)

      @org_user_1.remaining_here_isolines_quota.should == 300
      @org_user_2.remaining_here_isolines_quota.should == 300
    end
  end

  describe 'User#used_here_isolines_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      @user1.here_isolines_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.here_isolines_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the used here isolines quota in the current billing cycle' do
      usage_metrics = CartoDB::HereIsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))

      @user1.get_here_isolines_calls.should == 110
    end

    it 'calculates the used here isolines quota for an organization' do
      usage_metrics_1 = CartoDB::HereIsolinesUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::HereIsolinesUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:here_isolines, :isolines_generated, 100, DateTime.current)
      usage_metrics_2.incr(:here_isolines, :isolines_generated, 120, DateTime.current - 1)

      @organization.get_here_isolines_calls.should == 220
    end

    it 'calculates the used here isolines quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::HereIsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))
      usage_metrics.incr(:here_isolines, :empty_responses, 10, (DateTime.current - 2))

      @user1.get_here_isolines_calls.should == 120
    end
  end

  describe 'User#remaining data observatory snapshot quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016, 02, 28))
      Date.stubs(:current).returns(Date.new(2016, 02, 28))
      DateTime.stubs(:current).returns(DateTime.new(2016, 02, 28))
      @mock_redis = MockRedis.new
      @user1.obs_snapshot_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.obs_snapshot_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_snapshot, :success_responses, 100, DateTime.current)

      @user1.remaining_obs_snapshot_quota.should == 400
    end

    it 'takes into account data observatory requests performed by the org users' do
      usage_metrics_1 = CartoDB::ObservatorySnapshotUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::ObservatorySnapshotUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:obs_snapshot, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:obs_snapshot, :success_responses, 100, DateTime.current)

      @org_user_1.remaining_obs_snapshot_quota.should == 300
      @org_user_2.remaining_obs_snapshot_quota.should == 300
    end
  end

  describe 'User#remaining data observatory general quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016, 02, 28))
      Date.stubs(:current).returns(Date.new(2016, 02, 28))
      DateTime.stubs(:current).returns(DateTime.new(2016, 02, 28))
      @mock_redis = MockRedis.new
      @user1.obs_general_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.obs_general_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::ObservatoryGeneralUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_general, :success_responses, 100, DateTime.current)

      @user1.remaining_obs_general_quota.should == 400
    end

    it 'takes into account data observatory requests performed by the org users' do
      usage_metrics_1 = CartoDB::ObservatoryGeneralUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::ObservatoryGeneralUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:obs_general, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:obs_general, :success_responses, 100, DateTime.current)

      @org_user_1.remaining_obs_general_quota.should == 300
      @org_user_2.remaining_obs_general_quota.should == 300
    end
  end

  describe 'User#used_obs_snapshot_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016, 02, 28))
      Date.stubs(:current).returns(Date.new(2016, 02, 28))
      DateTime.stubs(:current).returns(DateTime.new(2016, 02, 28))
      @mock_redis = MockRedis.new
      @user1.obs_snapshot_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.obs_snapshot_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the used data observatory snapshot quota in the current billing cycle' do
      usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))

      @user1.get_obs_snapshot_calls.should == 110
    end

    it 'calculates the used data observatory snapshot quota for an organization' do
      usage_metrics_1 = CartoDB::ObservatorySnapshotUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::ObservatorySnapshotUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:obs_snapshot, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:obs_snapshot, :success_responses, 120, DateTime.current - 1)

      @organization.get_obs_snapshot_calls.should == 220
    end

    it 'calculates the used data observatory snapshot quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))
      usage_metrics.incr(:obs_snapshot, :empty_responses, 10, (DateTime.current - 2))

      @user1.get_obs_snapshot_calls.should == 120
    end
  end

  describe 'User#used_obs_general_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016, 02, 28))
      Date.stubs(:current).returns(Date.new(2016, 02, 28))
      DateTime.stubs(:current).returns(DateTime.new(2016, 02, 28))
      @mock_redis = MockRedis.new
      @user1.obs_general_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.obs_general_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the used data observatory general quota in the current billing cycle' do
      usage_metrics = CartoDB::ObservatoryGeneralUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))

      @user1.get_obs_general_calls.should == 110
    end

    it 'calculates the used data observatory general quota for an organization' do
      usage_metrics_1 = CartoDB::ObservatoryGeneralUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::ObservatoryGeneralUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:obs_general, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:obs_general, :success_responses, 120, DateTime.current - 1)

      @organization.get_obs_general_calls.should == 220
    end

    it 'calculates the used data observatory general quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::ObservatoryGeneralUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))
      usage_metrics.incr(:obs_general, :empty_responses, 10, (DateTime.current - 2))

      @user1.get_obs_general_calls.should == 120
    end
  end
end
