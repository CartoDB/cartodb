require_relative '../../../spec_helper_min'
require_relative '../../../support/helpers'

describe Carto::Superadmin::UsersController do
  include HelperMethods

  let(:superadmin_headers) do
    credentials = Cartodb.config[:superadmin]
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(
        credentials['username'],
        credentials['password']
      ),
      'HTTP_ACCEPT' => "application/json"
    }
  end

  let(:invalid_headers) do
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials('not', 'trusworthy'),
      'HTTP_ACCEPT' => "application/json"
    }
  end

  describe '#usage' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'fails without authorization' do
      get_json(usage_superadmin_user_url(@user.id), {}, invalid_headers) do |response|
        response.status.should eq 401
      end
    end

    shared_examples_for 'dataservices usage metrics' do
      before(:each) do
        @date = Date.today
        usage_metrics = @class.new(@user.username, nil, MockRedis.new)
        @class.stubs(:new).returns(usage_metrics)
        usage_metrics.incr(@service, :success_responses, 10, @date)
        usage_metrics.incr(@service, :success_responses, 100, @date - 2)
        usage_metrics.incr(@service, :empty_responses, 20, @date - 2)
        usage_metrics.incr(@service, :failed_responses, 30, @date - 1)
        usage_metrics.incr(@service, :total_requests, 40, @date)
      end

      it 'returns usage metrics' do
        get_json(usage_superadmin_user_url(@user.id), { from: Date.today - 5 }, superadmin_headers) do |response|
          success = response.body[@service][:success_responses]
          success.find { |h| h['date'] == @date.to_s }['value'].should eq 10
          success.find { |h| h['date'] == (@date - 2).to_s }['value'].should eq 100

          empty = response.body[@service][:empty_responses]
          empty.find { |h| h['date'] == (@date - 2).to_s }['value'].should eq 20

          error = response.body[@service][:failed_responses]
          error.find { |h| h['date'] == (@date - 1).to_s }['value'].should eq 30

          total = response.body[@service][:total_requests]
          total.find { |h| h['date'] == @date.to_s }['value'].should eq 40
        end
      end

      it 'returns totals' do
        get_json(usage_superadmin_user_url(@user.id), { from: Date.today - 5, totals: true }, superadmin_headers) do |response|
          response.body[@service][:success_responses].should eq 110
          response.body[@service][:empty_responses].should eq 20
          response.body[@service][:failed_responses].should eq 30
          response.body[@service][:total_requests].should eq 40
        end
      end
    end

    describe 'geocoder_internal' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_internal
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_here' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_here
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_google' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_google
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_cache' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_cache
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_mapzen' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_mapzen
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_mapbox' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_mapbox
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'geocoder_tomtom' do
      before(:all) do
        @class = CartoDB::GeocoderUsageMetrics
        @service = :geocoder_tomtom
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'here_isolines' do
      before(:all) do
        @class = CartoDB::IsolinesUsageMetrics
        @service = :here_isolines
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'mapzen_isolines' do
      before(:all) do
        @class = CartoDB::IsolinesUsageMetrics
        @service = :mapzen_isolines
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'mapbox_isolines' do
      before(:all) do
        @class = CartoDB::IsolinesUsageMetrics
        @service = :mapbox_isolines
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'tomtom_isolines' do
      before(:all) do
        @class = CartoDB::IsolinesUsageMetrics
        @service = :tomtom_isolines
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'obs_general' do
      before(:all) do
        @class = CartoDB::ObservatoryGeneralUsageMetrics
        @service = :obs_general
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'obs_snapshot' do
      before(:all) do
        @class = CartoDB::ObservatorySnapshotUsageMetrics
        @service = :obs_snapshot
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'routing_mapzen' do
      before(:all) do
        @class = CartoDB::RoutingUsageMetrics
        @service = :routing_mapzen
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'routing_mapbox' do
      before(:all) do
        @class = CartoDB::RoutingUsageMetrics
        @service = :routing_mapbox
      end

      it_behaves_like 'dataservices usage metrics'
    end

    describe 'routing_tomtom' do
      before(:all) do
        @class = CartoDB::RoutingUsageMetrics
        @service = :routing_tomtom
      end

      it_behaves_like 'dataservices usage metrics'
    end

    it 'returns mapviews' do
      key = CartoDB::Stats::APICalls.new.redis_api_call_key(@user.username, 'mapviews')
      $users_metadata.ZADD(key, 1, "20160915")
      key = CartoDB::Stats::APICalls.new.redis_api_call_key(@user.username, 'mapviews_es')
      $users_metadata.ZADD(key, 1, "20160915")
      get_json(usage_superadmin_user_url(@user.id), { from: "2016-09-14" }, superadmin_headers) do |response|
        mapviews = response.body[:mapviews][:total_views]
        mapviews.find { |h| h['date'] == "2016-09-15" }['value'].should eq 2
      end
    end

    it 'returns Twitter imports' do
      st = SearchTweet.create(
        user_id: @user.id,
        table_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        data_import_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        service_item_id: '555',
        retrieved_items: 42,
        state: ::SearchTweet::STATE_COMPLETE
      )
      get_json(usage_superadmin_user_url(@user.id), { from: Date.today - 5 }, superadmin_headers) do |response|
        tweets = response.body[:twitter_imports][:retrieved_items]
        formatted_date = st.created_at.to_date.to_s
        tweets.find { |h| h['date'] == formatted_date }['value'].should eq st.retrieved_items
        tweets.find { |h| h['date'] == (Date.today - 5).to_s }['value'].should eq 0
      end
      st.destroy
    end

    it 'does not return data outside the date range' do
      key = CartoDB::Stats::APICalls.new.redis_api_call_key(@user.username, 'mapviews')
      $users_metadata.ZADD(key, 23, "20160915")
      get_json(usage_superadmin_user_url(@user.id), { from: '2016-09-16' }, superadmin_headers) do |response|
        mapviews = response.body[:mapviews][:total_views]
        mapviews.should_not include :"2016-09-15"
      end
    end

    it 'returns only requested services' do
      get_json(usage_superadmin_user_url(@user.id), { services: ['mapviews'] }, superadmin_headers) do |response|
        response.body.keys.should eq [:mapviews]
      end
    end

    it 'returns an error for invalid services array format' do
      get_json(usage_superadmin_user_url(@user.id), { services: 'wadus' }, superadmin_headers) do |response|
        response.status.should eq 422
      end
    end

    it 'returns an error for invalid date format' do
      get_json(usage_superadmin_user_url(@user.id), { from: 'wadus' }, superadmin_headers) do |response|
        response.status.should eq 422
      end
    end

    it 'returns an error for unknown user' do
      get_json(usage_superadmin_user_url(UUIDTools::UUID.random_create.to_s), {}, superadmin_headers) do |response|
        response.status.should eq 404
      end
    end
  end

  describe '#destroy' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'should return specific error when user has related entities' do
      User.any_instance.stubs(:destroy).raises(CartoDB::SharedEntitiesError, 'Cannot delete user, has shared entities')
      delete_json(superadmin_user_url(@user), {}, superadmin_headers) do |response|
        response.status.should eq 422
        response.body[:errorCode].should eq 'userHasSharedEntities'
      end
      User.any_instance.unstub(:destroy)
    end

    it 'should remove user with shared entities if force is present' do
      User.any_instance.stubs(:has_shared_entities?).returns(true)
      delete_json(superadmin_user_url(@user), { force: true }, superadmin_headers) do |response|
        response.status.should eq 204
      end
      User.any_instance.unstub(:has_shared_entities?)
    end
  end
end
