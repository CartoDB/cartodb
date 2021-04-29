require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'
require 'helpers/database_connection_helper'

describe Carto::Api::Public::DataObservatoryController do
  include_context 'users helper'
  include HelperMethods
  include FeatureFlagHelper
  include DatabaseConnectionHelper

  before(:all) do
    @master = @user1.api_key
    @not_granted_token = @user1.api_keys.create_regular_key!(name: 'not_do', grants: [{ type: 'apis', apis: [] }]).token
    do_grants = [{ type: 'apis', apis: ['do'] }]
    @granted_token = @user1.api_keys.create_regular_key!(name: 'do', grants: do_grants).token
    @headers = { 'CONTENT_TYPE' => 'application/json' }
    @feature_flag = create(:feature_flag, name: 'do-instant-licensing', restricted: true)
  end

  after(:all) do
    @feature_flag.destroy
  end

  before(:each) do
    mock_do_metadata
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

      @next_year = Time.now + 1.year
      dataset1 = {
        dataset_id: 'carto.zzz.table1', expires_at: @next_year, status: 'active',
        project: 'carto', dataset: 'zzz', table: 'table1'
      }
      dataset2 = {
        dataset_id: 'carto.abc.table2', expires_at: @next_year, status: 'active',
        project: 'carto', dataset: 'abc', table: 'table2'
      }
      dataset3 = {
        dataset_id: 'opendata.tal.table3', expires_at: @next_year, status: 'active',
        project: 'opendata', dataset: 'tal', table: 'table3'
      }
      dataset4 = {
        dataset_id: 'carto.abc.expired', expires_at: Time.now - 1.day, status: 'active',
        project: 'carto', dataset: 'abc', table: 'expired'
      }
      dataset5 = {
        dataset_id: 'carto.abc.requested', expires_at: @next_year, status: 'requested',
        project: 'carto', dataset: 'abc', table: 'requested'
      }
      bq_datasets = [dataset1, dataset2, dataset3, dataset4, dataset5]
      @redis_key = "do:#{@user1.username}:datasets"
      $users_metadata.hset(@redis_key, 'bq', bq_datasets.to_json)
    end

    after(:all) do
      $users_metadata.del(@redis_key)
    end

    before(:each) do
      @doss = mock
      Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
      @doss.stubs(:sync).returns({sync_status: 'synced', sync_table: 'my_do_subscription'})
      @doss.stubs(:parsed_entity_id).returns({})
    end

    it_behaves_like 'an endpoint validating a DO API key'

    it 'checks if DO is enabled' do
      Carto::User.any_instance.expects(:do_enabled?).once

      get_json endpoint_url(api_key: @master), @headers
    end

    it 'returns 200 with the right status' do
      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
        datasets = response.body[:subscriptions]
        expect(datasets.count).to eq 5
        expect(datasets[0][:status]).to eq 'expired'
        expect(datasets[1][:status]).to eq 'requested'
        expect(datasets[2][:status]).to eq 'active'
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


    context 'ordering' do
      it 'orders by id ascending by default' do
        get_json endpoint_url(api_key: @master), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 5
          expect(datasets[0][:id]).to eq 'carto.abc.expired'
          expect(datasets[4][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by id descending' do
        get_json endpoint_url(api_key: @master, order_direction: 'desc'), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 5
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.zzz.table1'
        end
      end

      it 'orders by project descending' do
        params = { api_key: @master, order: 'project', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 5
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by dataset ascending' do
        params = { api_key: @master, order: 'dataset', order_direction: 'asc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 5
          expect(datasets[0][:id]).to eq 'carto.abc.table2'
          expect(datasets[1][:id]).to eq 'carto.abc.expired'
        end
      end

      it 'orders by table descending' do
        params = { api_key: @master, order: 'table', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 5
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.abc.table2'
        end
      end
    end

    context 'filter by status' do
      it 'returns only active datasets' do
        get_json endpoint_url(api_key: @master, status: 'active'), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 3
        end
      end
      it 'returns only requested dataset' do
        get_json endpoint_url(api_key: @master, status: 'requested'), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:subscriptions]
          expect(datasets.count).to eq 1
        end
      end
    end

    describe 'sync_info' do
      before(:each) do
        @doss = mock
        Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
        @doss.stubs(:sync).returns({sync_status: 'unsynced'})
        @doss.stubs(:parsed_entity_id).returns({})
      end

      it 'returns 404 if the subscription_id is not a valid user subscription' do
        @url_helper = 'api_v4_do_subscription_sync_info_url'
        get_json endpoint_url(api_key: @master, subscription_id: 'wrong'), @headers do |response|
          expect(response.status).to eq(404)
        end
      end

      it 'returns 200 with sync info if the subscription_id is valid' do
        @url_helper = 'api_v4_do_subscription_sync_info_url'
        get_json endpoint_url(api_key: @master, subscription_id: 'carto.zzz.table1'), @headers do |response|
          expect(response.status).to eq(200)
          expect(response.body).to eq(sync_status: 'unsynced')
        end
      end
    end

    describe 'create_sync' do
      before(:each) do
        @doss = mock
        Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
        @doss.stubs(:create_sync!).returns({sync_status: 'syncing'})
        @doss.stubs(:parsed_entity_id).returns({})
      end

      it 'returns 404 if the subscription_id is not a valid user subscription' do
        @url_helper = 'api_v4_do_subscription_create_sync_url'
        post_json endpoint_url(api_key: @master, subscription_id: 'wrong'), @headers do |response|
          expect(response.status).to eq(404)
        end
      end

      it 'returns 200 with sync info if the subscription_id is valid' do
        @url_helper = 'api_v4_do_subscription_create_sync_url'
        post_json endpoint_url(api_key: @master, subscription_id: 'carto.zzz.table1'), @headers do |response|
          expect(response.status).to eq(200)
          expect(response.body).to eq(sync_status: 'syncing')
        end
      end
    end

    describe 'destroy_sync' do
      before(:each) do
        @doss = mock
        Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
        @doss.stubs(:remove_sync!).returns(nil)
        @doss.stubs(:parsed_entity_id).returns({})
      end

      it 'returns 404 if the subscription_id is not a valid user subscription' do
        @url_helper = 'api_v4_do_subscription_destroy_sync_url'
        delete_json endpoint_url(api_key: @master, subscription_id: 'wrong'), @headers do |response|
          expect(response.status).to eq(404)
        end
      end

      it 'returns 204 if the subscription_id is valid' do
        @url_helper = 'api_v4_do_subscription_destroy_sync_url'
        delete_json endpoint_url(api_key: @master, subscription_id: 'carto.zzz.table1'), @headers do |response|
          expect(response.status).to eq(204)
        end
      end
    end
  end

  describe 'create_sample' do
    before(:each) do
      @doss = mock
      Carto::DoSampleServiceFactory.stubs(:get_for_user).returns(@doss)
      @doss.stubs(:import_sample!).returns(nil)
    end

    it 'returns 200 if the dataset_id is valid' do
      @url_helper = 'api_v4_do_subscription_create_sample_url'
      post_json endpoint_url(api_key: @master, dataset_id: 'carto.zzz.table1'), @headers do |response|
        expect(response.status).to eq(204)
      end
    end
  end
  describe 'subscription' do
    before(:all) do
      @url_helper = 'api_v4_do_subscription_show_url'

      @next_year = (Time.now + 1.year).to_s
      @datasets = [{
        dataset_id: 'carto.zzz.table1', expires_at: @next_year, status: 'active',
        project: 'carto', dataset: 'zzz', table: 'table1', :type=>"dataset", :id=>"carto.zzz.table1"
      }]
      @redis_key = "do:#{@user1.username}:datasets"
      $users_metadata.hset(@redis_key, 'bq', @datasets.to_json)
    end

    after(:all) do
      $users_metadata.del(@redis_key)
    end

    before(:each) do
      @doss = mock
      Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
      @doss.stubs(:parsed_entity_id).returns({type: 'dataset'})
    end

    it 'checks if DO is enabled' do
      Carto::User.any_instance.expects(:do_enabled?).once

      get_json endpoint_url(api_key: @master, subscription_id: 'proj.dat.tab'), @headers
    end

    it 'returns 400 if the id param is not valid' do
      get_json endpoint_url(api_key: @master, subscription_id: 'wrong'), @headers do |response|
        expect(response.status).to eq(400)
      end
    end

    it 'returns 200 if the subscription_id is valid' do
      subscription_id = @datasets[0][:dataset_id]
      get_json endpoint_url(api_key: @master, subscription_id: subscription_id), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to eq @datasets[0]
      end
    end
  end


  describe 'subscription_info' do
    before(:each) do
      # Cartodb::Central.any_instance.stubs(:check_do_enabled).returns(true)
      Carto::DoLicensingService.any_instance.stubs(:subscriptions).returns([@params])
    end

    after(:each) do
      # Cartodb::Central.any_instance.unstub(:check_do_enabled)
      Carto::DoLicensingService.any_instance.unstub(:subscriptions)
    end

    before(:all) do
      @url_helper = 'api_v4_do_subscription_info_url'
      @params = { id: 'carto.abc.dataset1', type: 'dataset' }
    end

    it 'checks if DO is enabled' do
      Carto::User.any_instance.expects(:do_enabled?).once

      get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers
    end

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

    it 'returns 404 if the dataset metadata does not exist' do
      id = 'carto.abc.inexistent'

      get_json endpoint_url(api_key: @master, id: id, type: 'dataset'), @headers do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: "No metadata found for #{id}", errors_cause: nil)
      end
    end



    context 'with right metadata' do

      it 'returns 200 with the metadata for a dataset' do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: 3.0,
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
        subscription = { id: 'carto.abc.geography1', type: 'geography' }
        Carto::DoLicensingService.any_instance.stubs(:subscriptions).returns([subscription])

        get_json endpoint_url(subscription.merge(api_key: @master)), @headers do |response|
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

      it 'returns 200 and null values with the metadata for a dataset with null price and delivery days' do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.datasetnull', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: nil,
            id: 'carto.abc.datasetnull',
            licenses: 'licenses',
            licenses_link: 'licenses_link',
            rights: 'rights',
            subscription_list_price: nil,
            tos: 'tos',
            tos_link: 'tos_link',
            type: 'dataset'
          }
          expect(response.body).to eq expected_response
        end
      end

      it 'returns 200 and 0.0 as price with the metadata for a dataset with 0.0 as price' do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.datasetzero', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: 3.0,
            id: 'carto.abc.datasetzero',
            licenses: 'licenses',
            licenses_link: 'licenses_link',
            rights: 'rights',
            subscription_list_price: 0.0,
            tos: 'tos',
            tos_link: 'tos_link',
            type: 'dataset'
          }
          expect(response.body).to eq expected_response
        end
      end

      it 'returns the default delivery days if estimated_delivery_days is 0 and instant licensing is not enabled' do
        expected_response = {
          estimated_delivery_days: 3.0,
          id: 'carto.abc.dataset1',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          subscription_list_price: 100.0,
          tos: 'tos',
          tos_link: 'tos_link',
          type: 'dataset'
        }

        with_feature_flag @user1, 'do-instant-licensing', false do
          get_json endpoint_url(api_key: @master, id: 'carto.abc.dataset1', type: 'dataset'), @headers do |response|
            expect(response.status).to eq(200)
            expect(response.body).to eq expected_response
          end
        end
      end

      it 'returns 200 with empty array in available_in' do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.datasetvalidatearrayempty', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(200)
        end
      end

      it 'returns 200 with a nil in available_in' do
        get_json endpoint_url(api_key: @master, id: 'carto.abc.datasetvalidatearraynil', type: 'dataset'), @headers do |response|
          expect(response.status).to eq(200)
        end
      end

    end
  end

  describe 'entity_info' do
    before(:all) do
      @url_helper = 'api_v4_do_entity_info_url'
    end

    before(:each) do
      # Cartodb::Central.any_instance.stubs(:check_do_enabled).returns(true)
      @doss = mock
      Carto::DoSyncServiceFactory.stubs(:get_for_user).returns(@doss)
      @doss.stubs(:parsed_entity_id).returns({})
    end

    after(:each) do
      # Cartodb::Central.any_instance.unstub(:check_do_enabled)
    end

    it 'returns 200 with dataset info ' do
      dataset_id = 'carto.zzz.table1'
      dataset_info = {
        id: dataset_id, project: 'carto', dataset: 'zzz', table: 'table1',
        estimated_size: 10000, estimated_row_count: 1000, estimated_columns_count: 1000
      }
      @doss.stubs(:entity_info).with(dataset_id).returns(dataset_info)
      get_json endpoint_url(api_key: @master, entity_id: dataset_id), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to eq(dataset_info)
      end
    end

    it 'returns 404 if the dataset does not exist ' do
      dataset_id = 'carto.zzz.table1'
      @doss.stubs(:entity_info).with(dataset_id).returns({ error: 'bad entity id'})
      get_json endpoint_url(api_key: @master, entity_id: dataset_id), @headers do |response|
        expect(response.status).to eq(404)
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

    it 'returns 404 if the dataset metadata does not exist' do
      post_json endpoint_url(api_key: @master), id: 'carto.abc.inexistent', type: 'dataset' do |response|
        expect(response.status).to eq(404)
        expect(response.body).to eq(errors: "No metadata found for carto.abc.inexistent", errors_cause: nil)
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

    it 'subscribes to public dataset' do
      dataset_id = 'carto.abc.public_dataset'

      DataObservatoryMailer.expects(:carto_request).never

      expected_params = {
        dataset_id: dataset_id,
        available_in: ['bq'],
        price: 0.0,
        created_at: Time.parse('2018/01/01 00:00:00'),
        expires_at: Time.parse('2019/01/01 00:00:00'),
        status: 'active'
      }

      mock_sync_service = mock
      Carto::DoSyncServiceFactory.expects(:get_for_user).once.returns(mock_sync_service)
      mock_sync_service.stubs(:parsed_entity_id).returns(expected_params)

      mock_service = mock
      mock_service.expects(:subscribe).with(expected_params).once
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)

      Time.stubs(:now).returns(Time.parse('2018/01/01 00:00:00'))

      post_json endpoint_url(api_key: @master), id: dataset_id, type: 'dataset' do |response|
        expect(response.status).to eq(200)
        expected_response = {
          estimated_delivery_days: 3.0,
          id: 'carto.abc.public_dataset',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          subscription_list_price: 0.0,
          tos: 'tos',
          tos_link: 'tos_link',
          type: 'dataset'
        }
        expect(response.body).to eq expected_response
      end
    end

    it 'creates a proper subscription request to premium data' do
      mailer_mock = stub(:deliver_now)
      dataset_id = 'carto.abc.geography1'
      dataset_name = 'CARTO geography 1'
      provider_name = 'CARTO'
      DataObservatoryMailer.expects(:carto_request).with(
        @carto_user1,
        dataset_id,
        3.0
      ).once.returns(mailer_mock)

      expected_params = {
        dataset_id: 'carto.abc.geography1',
        available_in: ['bq'],
        price: 90.0,
        created_at: Time.parse('2018/01/01 00:00:00'),
        expires_at: Time.parse('2019/01/01 00:00:00'),
        status: 'requested'
      }

      mock_sync_service = mock
      Carto::DoSyncServiceFactory.expects(:get_for_user).once.returns(mock_sync_service)
      mock_sync_service.stubs(:parsed_entity_id).returns(expected_params)

      mock_service = mock
      mock_service.expects(:subscribe).with(expected_params).once
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)
      Time.stubs(:now).returns(Time.parse('2018/01/01 00:00:00'))

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

    it 'subscribes if instant licensing is enabled and delivery time is 0' do
      with_feature_flag @user1, 'do-instant-licensing', true do
        expected_params = {
          dataset_id: 'carto.abc.dataset1',
          available_in: ['bq'],
          price: 100.0,
          created_at: Time.parse('2018/01/01 00:00:00'),
          expires_at: Time.parse('2019/01/01 00:00:00'),
          status: 'active'
        }

        mock_sync_service = mock
        Carto::DoSyncServiceFactory.expects(:get_for_user).once.returns(mock_sync_service)
        mock_sync_service.stubs(:parsed_entity_id).returns(expected_params)

        mock_service = mock
        mock_service.expects(:subscribe).with(expected_params).once
        Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)
        Time.stubs(:now).returns(Time.parse('2018/01/01 00:00:00'))

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

    it 'creates a proper subscription request when instant licensing is enabled and delivery time is not 0' do
      with_feature_flag @user1, 'do-instant-licensing', true do
        mailer_mock = stub(:deliver_now)
        dataset_id = 'carto.abc.deliver_1day'
        dataset_name = 'CARTO dataset 1'
        provider_name = 'CARTO'
        DataObservatoryMailer.expects(:carto_request).with(
          @carto_user1,
          dataset_id,
          1.0
        ).once.returns(mailer_mock)

        expected_params = {
          dataset_id: dataset_id,
          available_in: ['bq'],
          price: 100.0,
          created_at: Time.parse('2018/01/01 00:00:00'),
          expires_at: Time.parse('2019/01/01 00:00:00'),
          status: 'requested'
        }

        mock_sync_service = mock
        Carto::DoSyncServiceFactory.expects(:get_for_user).once.returns(mock_sync_service)
        mock_sync_service.stubs(:parsed_entity_id).returns(expected_params)

        mock_service = mock
        mock_service.expects(:subscribe).with(expected_params).once
        Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)
        Time.stubs(:now).returns(Time.parse('2018/01/01 00:00:00'))

        post_json endpoint_url(api_key: @master), id: dataset_id, type: 'dataset' do |response|
          expect(response.status).to eq(200)
          expected_response = {
            estimated_delivery_days: 1.0,
            id: 'carto.abc.deliver_1day',
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

    it 'returns 204 calls the DoLicensingService with the expected params' do
      mock_service = mock
      mock_service.expects(:unsubscribe).with('carto.abc.dataset1').once
      Carto::DoLicensingService.expects(:new).with(@user1.username).once.returns(mock_service)

      delete_json endpoint_url(@params) do |response|
        expect(response.status).to eq(204)
      end
    end
  end

  def mock_do_metadata
    (datasets_provider + cartographies_provider + special_cases_provider).each do |entry|
      Carto::Api::Public::DataObservatoryController
        .any_instance.stubs(:request_subscription_metadata).with(entry[:id], entry[:type]).returns(entry[:metadata])
    end
  end

  def datasets_provider
    [
      {
        id: 'carto.abc.dataset1',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 100.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO dataset 1',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.incomplete',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 100.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: nil,
          name: 'Incomplete dataset',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.datasetvalidatearrayempty',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 0.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: nil,
          name: 'CARTO dataset array empty',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.deliver_1day',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 1.0,
          subscription_list_price: 100.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO dataset 1',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.public_dataset',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 0.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO dataset 1',
          is_public_data: true,
          provider_name: 'CARTO'
        }
      }
    ]
  end

  def special_cases_provider
    [
      {
        id: 'carto.abc.datasetnull',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: nil,
          subscription_list_price: nil,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO dataset null',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.datasetzero',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 0.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO dataset zero',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.datasetvalidatearraynil',
        type: 'dataset',
        metadata: {
          estimated_delivery_days: 0.0,
          subscription_list_price: 0.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: nil,
          name: 'CARTO dataset array nil',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      },
      {
        id: 'carto.abc.inexistent',
        type: 'dataset',
        metadata: nil
      }
    ]
  end

  def cartographies_provider
    [
      {
        id: 'carto.abc.geography1',
        type: 'geography',
        metadata: {
          estimated_delivery_days: 3.0,
          subscription_list_price: 90.0,
          tos: 'tos',
          tos_link: 'tos_link',
          licenses: 'licenses',
          licenses_link: 'licenses_link',
          rights: 'rights',
          available_in: %w{bq},
          name: 'CARTO geography 1',
          is_public_data: false,
          provider_name: 'CARTO'
        }
      }
    ]
  end
end
