require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::DataObservatoryController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @master = @user1.api_key
    @not_granted_token = @user1.api_keys.create_regular_key!(name: 'not_do', grants: [{ type: 'apis', apis: [] }]).token
    do_grants = [{ type: 'apis', apis: ['do'] }]
    @granted_token = @user1.api_keys.create_regular_key!(name: 'do', grants: do_grants).token
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  before(:each) do
    host! "#{@user1.username}.localhost.lan"
  end

  shared_examples 'an endpoint validating a DO API key' do
    it 'returns 401 if the API key is wrong' do
      get_json endpoint_url(api_key: 'wrong'), @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key without DO grant' do
      get_json endpoint_url(api_key: @not_granted_token), @headers do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 200 when using the master API key' do
      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
      end
    end

    it 'returns 200 when using a regular API key with DO grant' do
      get_json endpoint_url(api_key: @granted_token), @headers do |response|
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

    it 'returns 500 if the central call fails' do
      central_error = CentralCommunicationFailure.new('boom')
      Cartodb::Central.any_instance.stubs(:get_do_token).raises(central_error)

      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(500)
      end
    end
  end

  describe 'datasets' do
    before(:all) do
      @url_helper = 'api_v4_do_datasets_url'

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

    it 'returns 200 with the non expired datasets' do
      get_json endpoint_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
        datasets = response.body[:datasets]
        expect(datasets.count).to eq 3
        expect(datasets.first).to eq(project: 'carto', dataset: 'abc', table: 'table2', id: 'carto.abc.table2')
      end
    end

    it 'returns 200 with an empty array if the user does not have datasets' do
      host! "#{@user2.username}.localhost.lan"

      get_json endpoint_url(api_key: @user2.api_key), @headers do |response|
        expect(response.status).to eq(200)
        datasets = response.body[:datasets]
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
          datasets = response.body[:datasets]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'carto.abc.table2'
          expect(datasets[1][:id]).to eq 'carto.zzz.table1'
        end
      end

      it 'orders by id descending' do
        get_json endpoint_url(api_key: @master, order_direction: 'desc'), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:datasets]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.zzz.table1'
        end
      end

      it 'orders by project descending' do
        params = { api_key: @master, order: 'project', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:datasets]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by dataset ascending' do
        params = { api_key: @master, order: 'dataset', order_direction: 'asc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:datasets]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'carto.abc.table2'
          expect(datasets[1][:id]).to eq 'opendata.tal.table3'
        end
      end

      it 'orders by table descending' do
        params = { api_key: @master, order: 'table', order_direction: 'desc' }
        get_json endpoint_url(params), @headers do |response|
          expect(response.status).to eq(200)
          datasets = response.body[:datasets]
          expect(datasets.count).to eq 3
          expect(datasets[0][:id]).to eq 'opendata.tal.table3'
          expect(datasets[1][:id]).to eq 'carto.abc.table2'
        end
      end
    end
  end
end
