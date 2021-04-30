require 'spec_helper_min'

describe Carto::DoLicensingService do

  before(:all) do
    @user = create(:valid_user, username: 'fulano')
    @redis_key = "do:fulano:datasets"
    @service = Carto::DoLicensingService.new('fulano')
    @dataset_id = 'carto.abc.dataset1'
    @dataset = {
      dataset_id: @dataset_id,
      available_in: ['bq', 'bigtable'],
      price: 100,
      created_at: Time.new(2020, 9, 27, 7, 59, 0),
      expires_at: Time.new(2021, 9, 27, 8, 0, 0),
      status: 'active'
    }
  end

  after(:all) do
    @user.destroy
  end

  after(:each) do
    $users_metadata.del(@redis_key)
  end

  describe '#subscribe' do
    before(:each) do
      @central_mock = mock
      Cartodb::Central.stubs(:new).returns(@central_mock)
      @service.stubs(:get_initial_sync_status).returns('unsynced')
      @service.stubs(:get_entity_info).returns({})
    end

    after(:each) do
      Cartodb::Central.unstub(:new)
      $users_metadata.del(@redis_key)
    end

    it 'calls create_do_datasets from Central with the expected parameters' do
      @central_mock.expects(:create_do_datasets).once.with(username: 'fulano', datasets: [@dataset])
      @service.subscribe(@dataset)
    end

    it 'stores the metadata in Redis' do
      @central_mock.stubs(:create_do_datasets)

      bq_redis = [
        {
          dataset_id: 'carto.abc.dataset1', created_at: '2020-09-27 07:59:00 +0000', expires_at: '2021-09-27 08:00:00 +0000',
          status: 'active', available_in: ['bq', 'bigtable'], license_type: nil, type: nil, estimated_size: 0, estimated_row_count: 0,
          estimated_columns_count: 0, num_bytes: 0, sync_status: 'unsynced', unsyncable_reason: nil,
          unsynced_errors: nil, sync_table: nil, sync_table_id: nil, synchronization_id: nil,
          full_access_status_bq: nil, full_access_status_azure: nil, full_access_status_aws: nil,
          full_access_aws_info: nil, full_access_azure_info: nil,
        }.stringify_keys
      ]

      bigtable_redis = bq_redis

      @service.subscribe(@dataset)
      JSON.parse($users_metadata.hget(@redis_key, 'bq')).should eq bq_redis
      JSON.parse($users_metadata.hget(@redis_key, 'bigtable')).should eq bigtable_redis
    end

    it 'allows to add more data in the same Redis key' do
      @central_mock.stubs(:create_do_datasets)

      new_dataset = {
        dataset_id: 'carto.abc.dataset3',
        available_in: ['bq'], price: 300,
        expires_at: '2020-09-27 08:00:00 +0000',
        status: 'active'
      }

      @service.subscribe(@dataset)
      @service.subscribe(new_dataset)

      bq_datasets = JSON.parse($users_metadata.hget(@redis_key, 'bq'))
      bigtable_datasets = JSON.parse($users_metadata.hget(@redis_key, 'bigtable'))
      bq_datasets.count.should eq 2
      bigtable_datasets.count.should eq 1
    end
  end

  describe '#unsubscribe' do
    before(:each) do
      @central_mock = mock
      Cartodb::Central.stubs(:new).returns(@central_mock)
      @service.stubs(:get_initial_sync_status).returns('unsynced')
    end

    after(:each) do
      Cartodb::Central.unstub(:new)
    end

    it 'calls remove_do_dataset from Central with the expected parameters' do
      @central_mock.expects(:remove_do_dataset).once.with(username: 'fulano', id: @dataset_id)

      @service.unsubscribe(@dataset_id)
    end

    it 'removes the metadata from Redis' do
      @service.stubs(:get_entity_info).returns(@dataset)
      @central_mock.stubs(:create_do_datasets)
      @central_mock.stubs(:remove_do_dataset)

      bq_datasets = [].to_json

      @service.subscribe(@dataset)
      @service.unsubscribe(@dataset_id)

      $users_metadata.hget(@redis_key, 'bq').should eq bq_datasets
    end
  end

end
