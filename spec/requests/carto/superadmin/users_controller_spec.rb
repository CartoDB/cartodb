require_relative '../../../spec_helper_min'
require_relative '../../../support/helpers'

describe Carto::Superadmin::UsersController do
  include HelperMethods

  let(:superadmin_headers) do
    credentials = Cartodb.config[:superadmin]
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(
        credentials['username'],
        credentials['password']),
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

    it 'returns mapviews' do
      key = CartoDB::Stats::APICalls.new.redis_api_call_key(@user.username, 'mapviews')
      $users_metadata.ZADD(key, 23, "20160915")
      get_json(usage_superadmin_user_url(@user.id), {}, superadmin_headers) do |response|
        mapviews = response.body[:mapviews][:total_views]
        mapviews[:"2016-09-15"].should eq 23
      end
    end

    it 'returns for Twitter imports' do
      st = SearchTweet.create(
        user_id: @user.id,
        table_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        data_import_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        service_item_id: '555',
        retrieved_items: 42,
        state: ::SearchTweet::STATE_COMPLETE
      )
      get_json(usage_superadmin_user_url(@user.id), {}, superadmin_headers) do |response|
        tweets = response.body[:twitter_imports][:retrieved_items]
        formatted_date = st.created_at.to_date.to_s.to_sym
        tweets[formatted_date].should eq st.retrieved_items
      end
      st.destroy
    end
  end
end
