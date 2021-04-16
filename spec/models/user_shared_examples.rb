require 'mock_redis'
require 'active_support/time'
require_relative '../../services/dataservices-metrics/lib/geocoder_usage_metrics'

# Tests should define the following method:
# - `get_twitter_imports_count_by_user_id`
# - `get_user_by_id`
shared_examples_for "user models" do
  let(:user1) { create(:valid_user, private_tables_enabled: true, private_maps_enabled: true) }
  let(:carto_user1) { user1.carto_user }
  let(:user2) { create(:valid_user, private_tables_enabled: true, private_maps_enabled: true) }
  let(:carto_user2) { user2.carto_user }

  describe '#get_twitter_imports_count' do
    it "should count tweet imports" do
      create(:search_tweet, user: carto_user1, retrieved_items: 5)
      create(:search_tweet, user: carto_user2, retrieved_items: 6)

      get_twitter_imports_count_by_user_id(carto_user1.id).should == 5
    end
  end

  describe 'twitter_datasource_enabled for org users' do
    before do
      @config = Cartodb.config.deep_dup
      CartoDB::Datasources::DatasourcesFactory.set_config(@config)
    end

    it 'is enabled if organization has it enabled and with custom config, no matter whether user has it or not,
        and enabled if he/she has it enabled and with custom config, no matter whether org has it or not' do
      twitter_search_conf = @config[:datasource_search]['twitter_search']
      custom_wadus = {
        "auth_required" => false,
        "username" => "xx",
        "password" => "xx",
        "search_url" => "http://fake.url.nil",
        "ratelimit_active" => false,
        "ratelimit_concurrency" => 3,
        "ratelimit_ttl" => 4,
        "ratelimit_wait_secs" => 0.1
      }
      twitter_search_conf['customized']['custom_wadus'] = custom_wadus

      twitter_search_conf['standard'] = custom_wadus
      organization.twitter_datasource_enabled = false
      organization.save!
      organization_user_1.twitter_datasource_enabled = true
      organization_user_1.save
      organization_user_1.reload
      twitter_search_conf['customized_user_list'] = []
      twitter_search_conf['customized_orgs_list'] = []
      twitter_search_conf['entity_to_config_map'] = []
      get_user_by_id(organization_user_1.id).twitter_datasource_enabled.should == false
      twitter_search_conf['standard'] = {}

      organization.twitter_datasource_enabled = false
      organization.save!
      organization_user_1.twitter_datasource_enabled = false
      organization_user_1.save
      organization_user_1.reload
      twitter_search_conf['customized_user_list'] = []
      twitter_search_conf['customized_orgs_list'] = []
      twitter_search_conf['entity_to_config_map'] = []
      get_user_by_id(organization_user_1.id).twitter_datasource_enabled.should == false

      organization.twitter_datasource_enabled = true
      organization.save!
      organization_user_1.twitter_datasource_enabled = false
      organization_user_1.save
      organization_user_1.reload
      twitter_search_conf['customized_user_list'] = []
      twitter_search_conf['customized_orgs_list'] = [organization.name]
      twitter_search_conf['entity_to_config_map'] = [{ organization.name => 'custom_wadus' }]
      get_user_by_id(organization_user_1.id).twitter_datasource_enabled.should == true

      organization.twitter_datasource_enabled = false
      organization.save!
      organization_user_1.twitter_datasource_enabled = true
      organization_user_1.save
      organization_user_1.reload
      twitter_search_conf['customized_user_list'] = [organization_user_1.username]
      twitter_search_conf['customized_orgs_list'] = []
      twitter_search_conf['entity_to_config_map'] = [{ organization_user_1.username => 'custom_wadus' }]
      get_user_by_id(organization_user_1.id).twitter_datasource_enabled.should == true
    end
  end

  describe 'User#remaining_geocoding_quota' do
    it 'calculates the remaining quota for a non-org user correctly' do
      user1.geocoding_quota = 500
      user1.geocoder_provider = 'heremaps'
      user1.save

      user1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(user1.username, nil)
      user1_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)

      get_user_by_id(user1.id).remaining_geocoding_quota.should == 400
    end

    it 'takes into account geocodings performed by the org users #4033' do
      pending('TODO: flacky spec. Pending to fix.')
      organization.geocoding_quota = 500
      organization.save!
      organization.owner.geocoder_provider = 'heremaps'
      organization.owner.save!

      org_user_1_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        organization_user_1.username,
        organization_user_1.organization.name
      )
      org_user_1_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)

      org_user_2_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(
        organization_user_2.username,
        organization_user_2.organization.name
      )
      org_user_2_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)

      get_user_by_id(organization_user_1.id).remaining_geocoding_quota.should == 300
      get_user_by_id(organization_user_2.id).remaining_geocoding_quota.should == 300
    end
  end

  describe 'User#used_geocoding_quota' do
    before do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      user1.geocoding_quota = 500
      user1.geocoder_provider = 'heremaps'
      user1.period_end_date = (Date.current + 1) << 1
      user1.save.reload
      organization.geocoding_quota = 500
      organization.save!
      organization.owner.period_end_date = (Date.current + 1) << 1
      organization.owner.geocoder_provider = 'heremaps'
      organization.owner.save!
    end

    it 'calculates the used geocoder quota in the current billing cycle' do
      usage_metrics = CartoDB::GeocoderUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics)
      Geocoding.new(kind: 'high-resolution',
                    user: user1,
                    formatter: '{dummy}',
                    processed_rows: 0,
                    cache_hits: 100,
                    created_at: (Date.current - 1)).save
      Geocoding.new(kind: 'high-resolution',
                    user: user1,
                    formatter: '{dummy}',
                    processed_rows: 100,
                    cache_hits: 0,
                    created_at: (Date.current - 2)).save
      Geocoding.new(kind: 'high-resolution',
                    user: user1,
                    formatter: '{dummy}',
                    processed_rows: 10,
                    cache_hits: 0,
                    created_at: Date.current).save
      usage_metrics.incr(:geocoder_here, :success_responses, 10, Date.current)
      usage_metrics.incr(:geocoder_here, :success_responses, 100, (Date.current - 2))
      usage_metrics.incr(:geocoder_cache, :success_responses, 100, (Date.current - 1))

      get_user_by_id(user1.id).get_geocoding_calls.should == 210
    end

    it 'calculates the used geocoding quota for an organization' do
      usage_metrics_1 = CartoDB::GeocoderUsageMetrics.new(organization_user_1.username, organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::GeocoderUsageMetrics.new(organization_user_2.username, organization.name, @mock_redis)
      organization.owner.geocoder_provider = 'heremaps'
      # We are going to get the organization data show we could use both usage_metrics objects
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics_1)
      Geocoding.new(kind: 'high-resolution',
                    user: organization_user_1.sequel_user,
                    formatter: '{dummy}',
                    processed_rows: 100,
                    created_at: Date.current).save

      Geocoding.new(kind: 'high-resolution',
                    user: organization_user_2.sequel_user,
                    formatter: '{dummy}',
                    processed_rows: 120,
                    cache_hits: 10,
                    created_at: Date.current - 1).save

      usage_metrics_1.incr(:geocoder_here, :success_responses, 100, Date.current)
      usage_metrics_2.incr(:geocoder_here, :success_responses, 120, Date.current - 1)
      usage_metrics_2.incr(:geocoder_cache, :success_responses, 10, Date.current - 1)

      organization.get_geocoding_calls.should == 230
    end

    it 'calculates the used geocoder quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::GeocoderUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:geocoder_here, :success_responses, 10, Date.current)
      usage_metrics.incr(:geocoder_here, :success_responses, 100, (Date.current - 2))
      usage_metrics.incr(:geocoder_here, :empty_responses, 10, (Date.current - 2))
      usage_metrics.incr(:geocoder_cache, :success_responses, 100, (Date.current - 1))

      get_user_by_id(user1.id).get_geocoding_calls.should == 220
    end
  end

  describe 'User#remaining here isolines quota' do
    before do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      user1.here_isolines_quota = 500
      user1.period_end_date = (Date.current + 1) << 1
      user1.isolines_provider = 'heremaps'
      user1.save.reload
      organization.here_isolines_quota = 500
      organization.save!
      organization.owner.period_end_date = (Date.current + 1) << 1
      organization.owner.isolines_provider = 'heremaps'
      organization.owner.save!
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, Date.current)

      user1.remaining_here_isolines_quota.should == 400
    end

    it 'takes into account here isoline requests performed by the org users' do
      usage_metrics_1 = CartoDB::IsolinesUsageMetrics.new(organization_user_1.username, organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::IsolinesUsageMetrics.new(organization_user_2.username, organization.name, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).
        with(organization.owner.username, organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:here_isolines, :isolines_generated, 100, Date.current)
      usage_metrics_2.incr(:here_isolines, :isolines_generated, 100, Date.current)

      organization_user_1.remaining_here_isolines_quota.should == 300
      organization_user_2.remaining_here_isolines_quota.should == 300
    end
  end

  describe 'User#used_here_isolines_quota' do
    before do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      user1.here_isolines_quota = 500
      user1.period_end_date = (Date.current + 1) << 1
      user1.isolines_provider = 'heremaps'
      user1.save.reload
      organization.here_isolines_quota = 500
      organization.save!
      organization.owner.period_end_date = (Date.current + 1) << 1
      organization.owner.isolines_provider = 'heremaps'
      organization.owner.save!
    end

    it 'calculates the used here isolines quota in the current billing cycle' do
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 10, Date.current)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, (Date.current - 2))

      user1.get_here_isolines_calls.should == 110
    end

    it 'calculates the used here isolines quota for an organization' do
      usage_metrics_1 = CartoDB::IsolinesUsageMetrics.new(organization_user_1.username, organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::IsolinesUsageMetrics.new(organization_user_2.username, organization.name, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).
        with(organization.owner.username, organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:here_isolines, :isolines_generated, 100, Date.current)
      usage_metrics_2.incr(:here_isolines, :isolines_generated, 120, Date.current - 1)

      organization.get_here_isolines_calls.should == 220
    end

    it 'calculates the used here isolines quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::IsolinesUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:here_isolines, :isolines_generated, 10, Date.current)
      usage_metrics.incr(:here_isolines, :isolines_generated, 100, (Date.current - 2))
      usage_metrics.incr(:here_isolines, :empty_responses, 10, (Date.current - 2))

      user1.get_here_isolines_calls.should == 120
    end
  end

  describe 'User#remaining routing quota' do
    before do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      user1.mapzen_routing_quota = 500
      user1.period_end_date = (Date.current + 1) << 1
      user1.routing_provider = 'mapbox'
      user1.save.reload
      organization.routing_provider = 'mapbox'
      organization.mapzen_routing_quota = 500
      organization.save!
      organization.owner.period_end_date = (Date.current + 1) << 1
      organization.owner.routing_provider = 'mapbox'
      organization.owner.save!
    end

    it 'calculates the remaining quota for a non-org user correctly' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)

      usage_metrics.incr(:routing_mapbox, :total_requests, 100, Date.current)
      usage_metrics.incr(:routing_mapbox, :success_responses, 100, Date.current)

      user1.remaining_mapzen_routing_quota.should == 400
    end

    it 'takes into account routing requests performed by the org users' do
      usage_metrics_1 = CartoDB::RoutingUsageMetrics.new(organization_user_1.username, organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::RoutingUsageMetrics.new(organization_user_2.username, organization.name, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).
        with(organization.owner.username, organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:routing_mapbox, :total_requests, 100, Date.current)
      usage_metrics_1.incr(:routing_mapbox, :success_responses, 100, Date.current)
      usage_metrics_2.incr(:routing_mapbox, :total_requests, 100, Date.current)
      usage_metrics_2.incr(:routing_mapbox, :success_responses, 100, Date.current)

      organization_user_1.remaining_mapzen_routing_quota.should == 300
      organization_user_2.remaining_mapzen_routing_quota.should == 300
    end
  end

  describe 'User#used_routing_quota' do
    before do
      Date.stubs(:today).returns(Date.new(2016,02,28))
      Date.stubs(:current).returns(Date.new(2016,02,28))
      DateTime.stubs(:current).returns(DateTime.new(2016,02,28))
      @mock_redis = MockRedis.new
      user1.mapzen_routing_quota = 500
      user1.period_end_date = (Date.current + 1) << 1
      user1.routing_provider = 'mapbox'
      user1.save.reload
      organization.routing_provider = 'mapbox'
      organization.mapzen_routing_quota = 500
      organization.save!
      organization.owner.period_end_date = (Date.current + 1) << 1
      organization.owner.routing_provider = 'mapbox'
      organization.owner.save!
    end

    it 'calculates the used mapzen routing quota in the current billing cycle' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:routing_mapbox, :total_requests, 10, Date.current)
      usage_metrics.incr(:routing_mapbox, :total_requests, 100, (Date.current - 2))
      usage_metrics.incr(:routing_mapbox, :success_responses, 10, Date.current)
      usage_metrics.incr(:routing_mapbox, :success_responses, 100, (Date.current - 2))

      user1.get_mapzen_routing_calls.should == 110
    end

    it 'calculates the used mapzen routing quota for an organization' do
      usage_metrics_1 = CartoDB::RoutingUsageMetrics.new(organization_user_1.username, organization.name, @mock_redis)
      usage_metrics_2 = CartoDB::RoutingUsageMetrics.new(organization_user_2.username, organization.name, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).
        with(organization.owner.username, organization.name).
        returns(usage_metrics_1)
      usage_metrics_1.incr(:routing_mapbox, :total_requests, 100, Date.current)
      usage_metrics_2.incr(:routing_mapbox, :total_requests, 120, Date.current - 1)
      usage_metrics_1.incr(:routing_mapbox, :success_responses, 100, Date.current)
      usage_metrics_2.incr(:routing_mapbox, :success_responses, 120, Date.current - 1)

      organization.get_mapzen_routing_calls.should == 220
    end

    it 'calculates the used mapzen routing quota in the current billing cycle including empty requests' do
      usage_metrics = CartoDB::RoutingUsageMetrics.new(user1.username, nil, @mock_redis)
      CartoDB::RoutingUsageMetrics.stubs(:new).returns(usage_metrics)
      usage_metrics.incr(:routing_mapbox, :total_requests, 10, Date.current)
      usage_metrics.incr(:routing_mapbox, :total_requests, 100, (Date.current - 2))
      usage_metrics.incr(:routing_mapbox, :success_responses, 10, Date.current)
      usage_metrics.incr(:routing_mapbox, :success_responses, 100, (Date.current - 2))
      usage_metrics.incr(:routing_mapbox, :empty_responses, 10, (Date.current - 2))

      user1.get_mapzen_routing_calls.should == 120
    end
  end


  describe 'single user' do
    before do
      @user = create_user
    end

    it 'generates auth_tokens and save them for future accesses' do
      token = @user.get_auth_token
      token.should be
      @user.reload
      @user.get_auth_token.should eq token
    end
  end

  describe '#needs_password_confirmation?' do
    before do
      @user = create_user
    end

    it 'is true for a normal user' do
      @user.needs_password_confirmation?.should == true

      @user.google_sign_in = nil
      @user.needs_password_confirmation?.should == true

      @user.google_sign_in = false
      @user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      @user.google_sign_in = true
      @user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      @user.google_sign_in = true
      @user.last_password_change_date = Time.now
      @user.needs_password_confirmation?.should == true
    end

    it 'is false for users within a SAML organization' do
      organization = create(:saml_organization)
      organization.auth_saml_enabled?.should == true
      @user.organization = @user.is_a?(Carto::User) ? Carto::Organization.find(organization.id) : organization
      @user.needs_password_confirmation?.should == false

      @user.organization = nil
      organization.destroy
    end
  end

  describe 'defaults and email and password changes checks' do
    before do
      @user = create_user
    end

    it "Should properly report ability to change (or not) email & password when proceeds" do
      @user.google_sign_in = false
      password_change_date = @user.last_password_change_date
      Carto::Ldap::Manager.any_instance.stubs(:configuration_present?).returns(false)

      @user.can_change_email?.should eq true
      @user.can_change_password?.should eq true

      @user.google_sign_in = true
      @user.can_change_email?.should eq false

      @user.last_password_change_date = nil
      @user.can_change_email?.should eq false

      Carto::Ldap::Manager.any_instance.stubs(:configuration_present?).returns(true)
      @user.can_change_email?.should eq false

      @user.last_password_change_date = password_change_date
      @user.google_sign_in = false
      @user.can_change_email?.should eq false

      @user.can_change_password?.should eq false
    end

    it "should set a default database_host" do
      @user.database_host.should eq ::SequelRails.configuration.environment_for(Rails.env)['host']
    end

    it "should set a default api_key" do
      @user.reload.api_key.should_not be_blank
    end

    it "should set created_at" do
      @user.created_at.should_not be_nil
    end

    it "should update updated_at" do
      expect {
        @user.name = "new #{@user.name}"
        @user.save
      }.to change(@user, :updated_at)
    end

    it "should set up a user after create" do
      @new_user = new_user
      @new_user.save
      @new_user.reload
      @new_user.should_not be_new
      @new_user.database_name.should_not be_nil
      @new_user.in_database.test_connection.should == true
      @new_user.destroy
    end

    it "should have a crypted password" do
      @user.crypted_password.should_not be_blank
      @user.crypted_password.should_not == 'admin123'
    end
  end

  describe 'batch_queries_statement_timeout' do
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
      user1.expects(:batch_queries_statement_timeout).never
      user1.expects(:batch_queries_statement_timeout=).never
      user1.save
    end

    it 'synces with central upon update_to_central' do
      cartodb_central_client_mock = mock
      cartodb_central_client_mock.expects(:update_user).once.with { |username, attributes|
        username == user1.username && attributes[:batch_queries_statement_timeout] == 42
      }
      Cartodb::Central.expects(:message_broker_sync_enabled?).once.returns(true)
      user1.expects(:cartodb_central_client).once.returns(cartodb_central_client_mock)

      user1.batch_queries_statement_timeout = 42
      user1.update_in_central
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
      $users_metadata.expects(:HDEL).with("limits:batch:#{user1.username}", 'timeout').once
      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', nil).never
      user1.batch_queries_statement_timeout = nil
      user1.batch_queries_statement_timeout.should be_nil
    end

    it 'deletes the key in redis when set to the empty string' do
      # This is important to sync from central and use the default value instead
      $users_metadata.expects(:HDEL).with("limits:batch:#{user1.username}", 'timeout').once
      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', "").never
      user1.batch_queries_statement_timeout = ""
      user1.batch_queries_statement_timeout.should be_nil
    end

    it 'sets the value in redis to the integer specified' do
      user1.save

      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', 42).once
      user1.batch_queries_statement_timeout = 42
      user1.batch_queries_statement_timeout.should eq 42
    end

    it 'raises an error if set to zero' do
      user1.save

      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', 0).never
      expect {
        user1.batch_queries_statement_timeout = 0
      }.to raise_exception
    end

    it 'raises an error if set to a negative value' do
      user1.save

      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', -42).never
      expect {
        user1.batch_queries_statement_timeout = -42
      }.to raise_exception
    end

    it 'can cast to integer values' do
      user1.save

      $users_metadata.expects(:HMSET).with("limits:batch:#{user1.username}", 'timeout', 42).once
      user1.batch_queries_statement_timeout = "42"
      user1.batch_queries_statement_timeout.should eq 42
    end
  end

  describe '#basemaps' do
    it 'shows all basemaps for Google Maps users' do
      user = create_user
      basemaps = user.basemaps
      basemaps.keys.sort.should eq ['CARTO', 'Stamen']
      user.google_maps_key = 'client=whatever'
      user.google_maps_private_key = 'wadus'
      user.save
      basemaps = user.basemaps
      basemaps.keys.sort.should eq ['CARTO', 'GMaps', 'Stamen']
    end
  end

  describe '#default_basemap' do
    it 'defaults to Google for Google Maps users, first declared basemap for others' do
      user = create_user
      user.default_basemap['name'].should eq Cartodb.default_basemap['name']
      user.google_maps_key = 'client=whatever'
      user.google_maps_private_key = 'wadus'
      user.save
      user.default_basemap['name'].should eq 'GMaps Roadmap'
    end
  end

  shared_examples_for 'google maps key inheritance' do
    before do
      @user = create_user
    end

    def set_user_field(value)
      @user.send(write_field + '=', value)
    end

    def set_organization_field(value)
      @user.stubs(:organization).returns(mock)
      @user.organization.stubs(write_field).returns(value)
    end

    def get_field
      @user.send(read_field)
    end

    it 'returns user key for users without organization' do
      set_user_field('wadus')
      get_field.should eq 'wadus'
    end

    it 'returns nil for users without organization nor key' do
      set_user_field(nil)
      get_field.should eq nil
    end

    it 'takes key from user if organization is not set' do
      set_user_field('wadus')
      set_organization_field(nil)
      get_field.should eq 'wadus'
    end

    it 'takes key from user if organization is blank' do
      set_user_field('wadus')
      set_organization_field('')
      get_field.should eq 'wadus'
    end

    it 'takes key from organization if both set' do
      set_user_field('wadus')
      set_organization_field('org_key')
      get_field.should eq 'org_key'
    end

    it 'returns nil if key is not set at user nor organization' do
      set_user_field(nil)
      set_organization_field(nil)
      get_field.should be_nil
    end
  end

  describe '#google_maps_api_key' do
    it_behaves_like 'google maps key inheritance' do
      let(:write_field) { 'google_maps_key' }
      let(:read_field) { 'google_maps_api_key' }
    end
  end

  describe '#google_maps_private_key' do
    it_behaves_like 'google maps key inheritance' do
      let(:write_field) { 'google_maps_private_key' }
      let(:read_field) { 'google_maps_private_key' }
    end
  end

  describe '#view_dashboard' do
    it 'sets dashboard_viewed_at time' do
      user = create_user
      user.dashboard_viewed_at = nil
      user.save

      user.view_dashboard
      last = user.dashboard_viewed_at
      last.should_not be_nil

      user.view_dashboard
      user.dashboard_viewed_at.should_not eq last
    end
  end

  describe '#name_or_username' do
    before do
      @user = create_user
    end

    it 'returns username if no name available' do
      @user.name = ''
      @user.last_name = nil
      expect(@user.name_or_username).to eq @user.username
    end

    it 'returns first name if available' do
      @user.name = 'Petete'
      @user.last_name = nil
      expect(@user.name_or_username).to eq 'Petete'
    end

    it 'returns last name if available' do
      @user.name = ''
      @user.last_name = 'Trapito'
      expect(@user.name_or_username).to eq 'Trapito'
    end

    it 'returns first+last name if available' do
      @user.name = 'Petete'
      @user.last_name = 'Trapito'
      expect(@user.name_or_username).to eq 'Petete Trapito'
    end
  end

  describe '#relevant_frontend_version' do
    before do
      @user = create_user
    end

    describe "when user doesn't have user_frontend_version set" do
      it 'should return application frontend version' do
        CartoDB::Application.stubs(:frontend_version).returns('app_frontend_version')

        @user.relevant_frontend_version.should eq 'app_frontend_version'
      end
    end

    describe 'when user has user_frontend_version set' do
      it 'should return user frontend version' do
        @user.frontend_version = 'user_frontend_version'

        @user.relevant_frontend_version.should eq 'user_frontend_version'
      end
    end
  end

  describe '#valid_password?' do
    before do
      @user = create_user
    end

    it 'returns true if the password is valid' do
      result = @user.valid_password?(:password, 'new_password', 'new_password')

      result.should be_true
    end

    it 'returns false if the passwords do not match' do
      result = @user.valid_password?(:password, 'new_password', 'other')

      result.should be_false
    end
  end

  describe '#valid_password_confirmation' do
    before do
      @user = create_user
    end

    it 'returns true if the password is valid' do
      @user.password = 'new_password'
      @user.save

      result = @user.valid_password_confirmation('new_password')

      result.should be_true
    end

    it 'returns false if the passwords is not correct' do
      result = @user.valid_password_confirmation('wrong_pass')

      result.should be_false
    end

    it 'returns true if SAML is enabled' do
      organization = create(:saml_organization)
      @user.organization_id = organization.id

      result = @user.valid_password_confirmation('wrong_pass')

      result.should be_true
    end
  end

  describe '#trial_ends_at' do
    before do
      @user = build_user
    end

    it 'returns nil if the account does not have a trial' do
      @user.account_type = 'ENTERPRISE'

      expect(@user.trial_ends_at).to be_nil
    end

    it 'returns the expected date for trial accounts' do
      @user.account_type = 'Free 2020'
      @user.created_at = Time.parse('2020-02-01 10:00:00')
      expected_date = Time.parse('2021-02-01 10:00:00')

      expect(@user.trial_ends_at).to eql expected_date
    end
  end

  describe '#remaining_trial_days' do
    before do
      @user = build_user
    end

    it 'returns 0 if the plan has no trial' do
      @user.account_type = 'FREE'

      expect(@user.remaining_trial_days).to eq 0
    end

    it 'returns 0 the trial has ended' do
      @user.account_type = 'Free 2020'
      @user.created_at = Time.now - 2.years

      expect(@user.remaining_trial_days).to eq 0
    end

    it 'returns the remaining number of trial days of the plan' do
      Delorean.time_travel_to('2019-01-15') do
        @user.account_type = 'Free 2020'
        @user.created_at = Time.now - 4.days

        expect(@user.remaining_trial_days).to eq 361
      end
    end

    it 'rounds up the remaining days' do
      Delorean.time_travel_to('2019-01-15') do
        @user.account_type = 'Free 2020'
        @user.created_at = Time.now - 28.hours

        expect(@user.remaining_trial_days).to eq 364
      end
    end

    it 'starts with 365 days for Free accounts in regular years' do
      Delorean.time_travel_to('2019-01-15') do
        @user.account_type = 'Free 2020'
        @user.created_at = Time.now

        expect(@user.remaining_trial_days).to eq 365
      end
    end

    it 'starts with 366 days for Free accounts in leap years' do
      Delorean.time_travel_to('2020-01-15') do
        @user.account_type = 'Free 2020'
        @user.created_at = Time.now

        expect(@user.remaining_trial_days).to eq 366
      end
    end
  end

  describe '#show_trial_reminder?' do
    before do
      @user = build_user
    end

    it 'returns false if the account does not have a trial' do
      @user.account_type = 'FREE'

      expect(@user.show_trial_reminder?).to be_false
    end

    it 'returns false if the account has an expired trial' do
      @user.account_type = 'Free 2020'
      @user.created_at = Time.now - 2.years

      expect(@user.show_trial_reminder?).to be_false
    end

    it 'returns true if the account has an active trial with less than 30 remaining days' do
      @user.account_type = 'Free 2020'
      @user.created_at = Time.now - 360.days

      expect(@user.show_trial_reminder?).to be_true
    end

    it 'returns false if the account has an active trial with more than 30 remaining days' do
      @user.account_type = 'Free 2020'
      @user.created_at = Time.now - 1.day

      expect(@user.show_trial_reminder?).to be_false
    end
  end

  describe '#organization_owner?' do
    it 'returns false if the user does not have organization nor id' do
      user = build_user
      user.organization = nil
      user.id = nil

      expect(user.organization_owner?).to be_false
    end
  end
end
