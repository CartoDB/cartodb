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
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, DateTime.current)

      @user1.remaining_here_isolines_quota.should == 400
    end

    it 'takes into account here isoline requests performed by the org users' do
      usage_metrics_1 = CartoDB::IsolinesUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::IsolinesUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).
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
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))

      @user1.get_here_isolines_calls.should == 110
    end

    it 'calculates the used here isolines quota for an organization' do
      usage_metrics_1 = CartoDB::IsolinesUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::IsolinesUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:here_isolines, :isolines_generated, 100, DateTime.current)
      usage_metrics_2.incr(:here_isolines, :isolines_generated, 120, DateTime.current - 1)

      @organization.get_here_isolines_calls.should == 220
    end

    it 'calculates the used here isolines quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
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

  describe 'User#remaining mapzen routing quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      @user1.mapzen_routing_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.mapzen_routing_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)

      usage_metrics.incr(:routing_mapzen, :total_requests, 100, DateTime.current)
      usage_metrics.incr(:routing_mapzen, :success_responses, 100, DateTime.current)

      @user1.remaining_mapzen_routing_quota.should == 400
    end

    it 'takes into account mapzen routing requests performed by the org users' do
      usage_metrics_1 = CartoDB::RoutingUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::RoutingUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:routing_mapzen, :total_requests, 100, DateTime.current)
      usage_metrics_1.incr(:routing_mapzen, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:routing_mapzen, :total_requests, 100, DateTime.current)
      usage_metrics_2.incr(:routing_mapzen, :success_responses, 100, DateTime.current)

      @org_user_1.remaining_mapzen_routing_quota.should == 300
      @org_user_2.remaining_mapzen_routing_quota.should == 300
    end
  end

  describe 'User#used_mapzen_routing_quota' do
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      @user1.mapzen_routing_quota = 500
      @user1.period_end_date = (DateTime.current + 1) << 1
      @user1.save.reload
      @organization.mapzen_routing_quota = 500
      @organization.save.reload
      @organization.owner.period_end_date = (DateTime.current + 1) << 1
      @organization.owner.save.reload
    end

    it 'calculates the used mapzen routing quota in the current billing cycle' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:routing_mapzen, :total_requests, 10, DateTime.current)
      usage_metrics.incr(:routing_mapzen, :total_requests, 100, (DateTime.current - 2))
      usage_metrics.incr(:routing_mapzen, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:routing_mapzen, :success_responses, 100, (DateTime.current - 2))

      @user1.get_mapzen_routing_calls.should == 110
    end

    it 'calculates the used mapzen routing quota for an organization' do
      usage_metrics_1 = CartoDB::RoutingUsageMetrics.new(@org_user_1.username, @organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::RoutingUsageMetrics.new(@org_user_2.username, @organization.name, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).
        with(@organization.owner.username, @organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:routing_mapzen, :total_requests, 100, DateTime.current)
      usage_metrics_2.incr(:routing_mapzen, :total_requests, 120, DateTime.current - 1)
      usage_metrics_1.incr(:routing_mapzen, :success_responses, 100, DateTime.current)
      usage_metrics_2.incr(:routing_mapzen, :success_responses, 120, DateTime.current - 1)

      @organization.get_mapzen_routing_calls.should == 220
    end

    it 'calculates the used mapzen routing quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(@user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:routing_mapzen, :total_requests, 10, DateTime.current)
      usage_metrics.incr(:routing_mapzen, :total_requests, 100, (DateTime.current - 2))
      usage_metrics.incr(:routing_mapzen, :success_responses, 10, DateTime.current)
      usage_metrics.incr(:routing_mapzen, :success_responses, 100, (DateTime.current - 2))
      usage_metrics.incr(:routing_mapzen, :empty_responses, 10, (DateTime.current - 2))

      @user1.get_mapzen_routing_calls.should == 120
    end
  end


  describe 'single user' do
    before(:all) do
      @user = create_user
    end

    after(:all) do
      User[@user.id].destroy
    end

    it 'generates auth_tokens and save them for future accesses' do
      token = @user.get_auth_token
      token.should be
      @user.reload
      @user.get_auth_token.should eq token
    end
  end

  describe 'batch_queries_statement_timeout' do

    include_context 'users helper'

    it 'batch_queries_statement_timeout is not touched at all when creating a user' do
      User.expects(:batch_queries_statement_timeout).never
      User.expects(:batch_queries_statement_timeout=).never
      begin
        user = create_user
      ensure
        user.destroy
      end
    end

    it 'batch_queries_statement_timeout is not touched at all when saving a user' do
      @user1.expects(:batch_queries_statement_timeout).never
      @user1.expects(:batch_queries_statement_timeout=).never
      @user1.save
    end

    it 'synces with central upon update_to_central' do
      cartodb_central_client_mock = mock
      cartodb_central_client_mock.expects(:update_user).once.with { |username, attributes|
        username == @user1.username && attributes[:batch_queries_statement_timeout] == 42
      }
      @user1.expects(:sync_data_with_cartodb_central?).once.returns(true)
      @user1.expects(:cartodb_central_client).once.returns(cartodb_central_client_mock)

      @user1.batch_queries_statement_timeout = 42
      @user1.update_in_central
    end

    it 'reads from redis just once' do
      begin
        user = create_user
        $users_metadata.expects(:HMGET).with("limits:batch:#{user.username}", 'timeout').once.returns([42])
        user.batch_queries_statement_timeout.should be 42
        user.batch_queries_statement_timeout.should be 42
      ensure
        user.destroy
      end
    end

    it 'reads from redis just once, even if nil' do
      begin
        user = create_user
        $users_metadata.expects(:HMGET).with("limits:batch:#{user.username}", 'timeout').once.returns([nil])
        user.batch_queries_statement_timeout.should be_nil
        user.batch_queries_statement_timeout.should be_nil
      ensure
        user.destroy
      end
    end

    it 'deletes the key in redis when set to nil' do
      $users_metadata.expects(:HDEL).with("limits:batch:#{@user1.username}", 'timeout').once
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', nil).never
      @user1.batch_queries_statement_timeout = nil
      @user1.batch_queries_statement_timeout.should be_nil
    end

    it 'deletes the key in redis when set to the empty string' do
      # This is important to sync from central and use the default value instead
      $users_metadata.expects(:HDEL).with("limits:batch:#{@user1.username}", 'timeout').once
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', "").never
      @user1.batch_queries_statement_timeout = ""
      @user1.batch_queries_statement_timeout.should be_nil
    end

    it 'sets the value in redis to the integer specified' do
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', 42).once
      @user1.batch_queries_statement_timeout = 42
      @user1.batch_queries_statement_timeout.should eq 42
    end

    it 'raises an error if set to zero' do
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', 0).never
      expect {
        @user1.batch_queries_statement_timeout = 0
      }.to raise_exception
    end

    it 'raises an error if set to a negative value' do
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', -42).never
      expect {
        @user1.batch_queries_statement_timeout = -42
      }.to raise_exception
    end

    it 'can cast to integer values' do
      $users_metadata.expects(:HMSET).with("limits:batch:#{@user1.username}", 'timeout', 42).once
      @user1.batch_queries_statement_timeout = "42"
      @user1.batch_queries_statement_timeout.should eq 42
    end
  end
end
