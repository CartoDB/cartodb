require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'

describe Carto::Api::Public::DataObservatoryController do
  include_context 'users helper'
  include HelperMethods
  include FeatureFlagHelper

  before(:all) do
    @master = @user1.api_key
    @not_granted_token = @user1.api_keys.create_regular_key!(name: 'not_do', grants: [{ type: 'apis', apis: [] }]).token
    do_grants = [{ type: 'apis', apis: ['do'] }]
    @granted_token = @user1.api_keys.create_regular_key!(name: 'do', grants: do_grants).token
    @headers = { 'CONTENT_TYPE' => 'application/json' }
    populate_do_metadata
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'do-licensing', restricted: true)
    Carto::FeatureFlagsUser.create(user_id: @user1.id, feature_flag_id: @feature_flag.id)
  end

  after(:all) do
    Carto::User.find_by_username('do-metadata').destroy
    @feature_flag.destroy
  end

  before(:each) do
    host! "#{@user1.username}.localhost.lan"
  end

  shared_examples 'an endpoint validating a DO API key' do
    before(:all) do
      @params ||= {}
    end

    it 'returns 401 if the API key is wrong' do
      get_json endpoint_url(@params.merge(api_key: 'wrong')), @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key without DO grant' do
      get_json endpoint_url(@params.merge(api_key: @not_granted_token)), @headers do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 200 when using the master API key' do
      get_json endpoint_url(@params.merge(api_key: @master)), @headers do |response|
        expect(response.status).to eq(200)
      end
    end

    it 'returns 200 when using a regular API key with DO grant' do
      get_json endpoint_url(@params.merge(api_key: @granted_token)), @headers do |response|
        expect(response.status).to eq(200)
      end
    end
  end

  def endpoint_url(params = {})
    send(@url_helper, params)
  end

  describe 'token' do
    before(:all) do
      @url_helper = 'api_v4_do_token_url'
      @expected_body = [{ 'access_token' => 'tokenuco' }]
    end

    before(:each) do
      Cartodb::Central.any_instance.stubs(:get_do_token).returns(@expected_body.to_json)
    end

    after(:each) do
      Cartodb::Central.any_instance.unstub(:get_do_token)
    end

    it_behaves_like 'an endpoint validating a DO API key'

    it 'calls Central to request the token' do
      Cartodb::Central.any_instance.expects(:get_do_token).with(@user1.username).once.returns(@expected_body.to_json)

      get_json endpoint_url(api_key: @master), @headers
    end

    it 'returns 200 with an access token' do
      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to eq @expected_body
      end
    end

    it 'returns 500 with an explicit message if the central call fails' do
      central_response = OpenStruct.new(code: 500, body: { errors: ['boom'] }.to_json)
      central_error = CartoDB::CentralCommunicationFailure.new(central_response)
      Cartodb::Central.any_instance.stubs(:get_do_token).raises(central_error)

      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(500)
        expect(response.body).to eq(errors: ["boom"])
      end
    end
  end

  describe 'subscriptions' do
    before(:all) do
      @url_helper = 'api_v4_do_subscriptions_show_url'

      next_year = Time.now + 1.year
      dataset1 = { dataset_id: 'carto.zzz.table1', expires_at: next_year }
      dataset2 = { dataset_id: 'carto.abc.table2', expires_at: next_year }
      dataset3 = { dataset_id: 'opendata.tal.table3', expires_at: next_year }
      dataset4 = { dataset_id: 'carto.abc.expired', expires_at: Time.now - 1.day }
      bq_datasets = [dataset1, dataset2, dataset3, dataset4]
      @redis_key = "do:#{@user1.username}:datasets"
      $users_metadata.hset(@redis_key, 'bq', bq_datasets.to_json)
    end

    after(:all) do
      $users_metadata.del(@redis_key)
    end

    it_behaves_like 'an endpoint validating a DO API key'

    it 'returns 200 with the non expired subscriptions' do
      expected_dataset = { project: 'carto', dataset: 'abc', table: 'table2', id: 'carto.abc.table2', type: 'dataset' }
      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
        datasets = response.body[:subscriptions]
        expect(datasets.count).to eq 3
        expect(datasets.first).to eq expected_dataset
      end
    end

    it 'returns 200 with an empty array if the user does not have datasets' do
      host! "#{@user2.username}.localhost.lan"

      get_json endpoint_url(api_key: @user2.api_key), @headers do |response|
        expect(response.status).to eq(200)
        datasets = response.body[:subscriptions]
        expect(datasets.count).to eq 0
      end
    end

    it 'returns 500 if the stored metadata is wrong' do
      host! "#{@user2.username}.localhost.lan"
      redis_key = "do:#{@user2.username}:datasets"
      wrong_datasets = [{ dataset_id: 'wrong', expires_at: 'wrong' }]
      $users_metadata.hset(redis_key, 'bq', wrong_datasets.to_json)

      get_json endpoint_url(api_key: @user2.api_key), @headers do |response|
        expect(response.status).to eq(500)
        expect(response.body).to eq(errors: "no time information in \"wrong\"")
      end

      $users_metadata.del(redis_key)
    end

    context 'ordering' do
      it 'orders by id ascending by default' do
        get_json endpoint_url(api_key: @master), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'carto.abc.table2'
          expect(datasets[1][:id]).to eq 'carto.zzz.table1'
        end
      end

      it 'orders by id descending' do
        get_json endpoint_url(api_key: @master, order_direction: 'desc'), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.zzz.table1'
        end
      end

      it 'orders by project descending' do
        params = { api_key: @master, order: 'project', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by dataset ascending' do
        params = { api_key: @master, order: 'dataset', order_direction: 'asc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'carto.abc.table2'
          expect(datasets[1][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by table descending' do
        params = { api_key: @master, order: 'table', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.abc.table2'
        end
      end
    end
  end

  describe 'subscription_info' do
    before(:all) do
      @url_helper = 'api_v4_do_subscription_info_url'
      @params = { id: 'carto.abc.dataset1', type: 'dataset' }
    end

    it_behaves_like 'an endpoint validating a DO API key'

    it 'returns 400 if the id param is not valid' do
      get_json endpoint_url(api_key: @master, id: 'wrong'), @headers do |response|
        expect(response.status).to eq(400)
        expect(response.body).to eq(errors: "Wrong 'id' parameter value.", errors_cause: nil)
      end
    end

    it 'returns 400 if the type param is not valid' do
      get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'wrong'), @headers do |response|
        expect(response.status).to eq(400)
        expected_response = {
          errors: "Wrong 'type' parameter value. Valid values are one of dataset, geography",
          errors_cause: nil
        }
        expect(response.body).to eq expected_response
      end
    end

    it 'returns 403 if the feature flag is not enabled for the user' do
      with_feature_flag @user1, 'do-licensing', false do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(403)
          expect(response.body).to eq(errors: "DO licensing not enabled", errors_cause: nil)
        end
      end
    end

    it 'returns 404 if the metadata user does not exist' do
      Carto::User.find_by_username('do-metadata').destroy

      get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: 'No Data Observatory metadata found', errors_cause: nil)
      end

      populate_do_metadata
    end

    it 'returns 404 if the dataset metadata does not exist' do
      get_json endpoint_url(api_key: @master, id: 'carto.abc.inexistent', type: 'dataset'), @headers do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: 'No metadata found for carto.abc.inexistent', errors_cause: nil)
      end
    end

    it 'returns 200 with the metadata for a dataset' do
      get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers do |response|
        expect(response.status).to eq(200)
        expected_response = {
          estimated_delivery_days: 0.0,
          id: 'carto.abc.dataset1',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          subscription_list_price: 100.0,
          tos: 'tos',
          tos_link: 'tos_link',
          type: 'dataset'
        }
        expect(response.body).to eq expected_response
      end
    end

    it 'returns 200 with the metadata for a geography' do
      get_json endpoint_url(api_key: @master, id: 'carto.abc.geography1', type: 'geography'), @headers do |response|
        expect(response.status).to eq(200)
        expected_response = {
          estimated_delivery_days: 3.0,
          id: 'carto.abc.geography1',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          subscription_list_price: 90.0,
          tos: 'tos',
          tos_link: 'tos_link',
          type: 'geography'
        }
        expect(response.body).to eq expected_response
      end
    end

  end

  describe 'subscribe' do
    before(:all) do
      @url_helper = 'api_v4_do_subscriptions_create_url'
      @payload = { id: 'carto.abc.dataset1', type: 'dataset' }
    end

    it 'returns 400 if the id param is not valid' do
      post_json endpoint_url(api_key: @master), id: 'wrong' do |response|
        expect(response.status).to eq(400)
        expect(response.body).to eq(errors: "Wrong 'id' parameter value.", errors_cause: nil)
      end
    end

    it 'returns 400 if the type param is not valid' do
      post_json endpoint_url(api_key: @master), id: 'carto.abc.dataset1', type: 'wrong' do |response|
        expect(response.status).to eq(400)
        expected_response = {
          errors: "Wrong 'type' parameter value. Valid values are one of dataset, geography",
          errors_cause: nil
        }
        expect(response.body).to eq expected_response
      end
    end

    it 'returns 403 if the feature flag is not enabled for the user' do
      with_feature_flag @user1, 'do-licensing', false do
        post_json endpoint_url(api_key: @master), @payload do |response|
          expect(response.status).to eq(403)
          expect(response.body).to eq(errors: "DO licensing not enabled", errors_cause: nil)
        end
      end
    end

    it 'returns 404 if the metadata user does not exist' do
      Carto::User.find_by_username('do-metadata').destroy

      post_json endpoint_url(api_key: @master), @payload do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: "No Data Observatory metadata found", errors_cause: nil)
      end

      populate_do_metadata
    end

    it 'returns 404 if the dataset metadata does not exist' do
      post_json endpoint_url(api_key: @master), id: 'carto.abc.inexistent', type: 'dataset' do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: "No metadata found for carto.abc.inexistent", errors_cause: nil)
      end
    end

    it 'returns 404 if the dataset metadata is incomplete' do
      post_json endpoint_url(api_key: @master), id: 'carto.abc.incomplete', type: 'dataset' do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: "Incomplete metadata found for carto.abc.incomplete", errors_cause: nil)
      end
    end

    it 'returns 500 with an explicit message if the central call fails' do
      central_response = OpenStruct.new(code: 500, body: { errors: ['boom'] }.to_json)
      central_error = CartoDB::CentralCommunicationFailure.new(central_response)
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.raises(central_error)

      post_json endpoint_url(api_key: @master), @payload do |response|
        expect(response.status).to eq(500)
        expect(response.body).to eq(errors: ["boom"])
      end
    end

    it 'returns 200 with the dataset metadata and calls the DoLicensingService with the expected params' do
      expected_params = [{
        dataset_id: 'carto.abc.dataset1',
        available_in: ['bq'],
        price: 100.0,
        expires_at: Time.parse('2019/01/01 00:00:00')
      }]

      mock_service = mock
      mock_service.expects(:subscribe).with(expected_params).once
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)

      Delorean.time_travel_to '2018/01/01 00:00:00' do
        post_json endpoint_url(api_key: @master), @payload do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: 0.0,
            id: 'carto.abc.dataset1',
            licenses: 'licenses',
            licenses_link: 'licenses_link',
            rights: 'rights',
            subscription_list_price: 100.0,
            tos: 'tos',
            tos_link: 'tos_link',
            type: 'dataset'
          }
          expect(response.body).to eq expected_response
        end
      end
    end

    it 'returns 200 with the dataset metadata without calling DoLicensingService when the delivery time is not 0' do
      Carto::DoLicensingService.expects(:new).never

      Delorean.time_travel_to '2018/01/01 00:00:00' do
        post_json endpoint_url(api_key: @master), id: 'carto.abc.geography1', type: 'geography' do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: 3.0,
            id: 'carto.abc.geography1',
            licenses: 'licenses',
            licenses_link: 'licenses_link',
            rights: 'rights',
            subscription_list_price: 90.0,
            tos: 'tos',
            tos_link: 'tos_link',
            type: 'geography'
          }
          expect(response.body).to eq expected_response
        end
      end
    end

  end

  describe 'unsubscribe' do
    before(:all) do
      @url_helper = 'api_v4_do_subscriptions_destroy_url'
      @params = { api_key: @master, id: 'carto.abc.dataset1' }
    end

    it 'returns 400 if the id param is not valid' do
      delete_json endpoint_url(@params.merge(id: 'wrong')) do |response|
        expect(response.status).to eq(400)
        expect(response.body).to eq(errors: "Wrong 'id' parameter value.", errors_cause: nil)
      end
    end

    it 'returns 403 if the feature flag is not enabled for the user' do
      with_feature_flag @user1, 'do-licensing', false do
        delete_json endpoint_url(@params) do |response|
          expect(response.status).to eq(403)
          expect(response.body).to eq(errors: "DO licensing not enabled", errors_cause: nil)
        end
      end
    end

    it 'returns 204 calls the DoLicensingService with the expected params' do
      mock_service = mock
      mock_service.expects(:unsubscribe).with('carto.abc.dataset1').once
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)

      delete_json endpoint_url(@params) do |response|
        expect(response.status).to eq(204)
      end
    end
  end

  def populate_do_metadata
    metadata_user = FactoryGirl.create(:user, username: 'do-metadata')
    db_seed = %{
      CREATE TABLE datasets(id text, estimated_delivery_days numeric, subscription_list_price numeric, tos text,
                            tos_link text, licenses text, licenses_link text, rights text, available_in text[]);
      INSERT INTO datasets VALUES ('carto.abc.dataset1', 0.0, 100.0, 'tos', 'tos_link', 'licenses', 'licenses_link',
                                   'rights', '{bq}');
      INSERT INTO datasets VALUES ('carto.abc.incomplete', 0.0, 100.0, 'tos', 'tos_link', 'licenses', 'licenses_link',
                                   'rights', NULL);
      CREATE TABLE geographies(id text, estimated_delivery_days numeric, subscription_list_price numeric, tos text,
                               tos_link text, licenses text, licenses_link text, rights text, available_in text[]);
      INSERT INTO geographies VALUES ('carto.abc.geography1', 3.0, 90.0, 'tos', 'tos_link', 'licenses', 'licenses_link',
                                      'rights', '{bq}');
    }
    metadata_user.in_database.run(db_seed)
  end
end
