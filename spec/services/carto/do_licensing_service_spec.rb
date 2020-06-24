require 'spec_helper_min'

describe Carto::DoLicensingService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @redis_key = "do:fulano:datasets"
    @service = Carto::DoLicensingService.new('fulano')
    @dataset_id = 'carto.abc.dataset1'
    @dataset = {
      dataset_id: @dataset_id,
      available_in: ['bq', 'bigtable'],
      price: 100,
      expires_at: Time.new(2020, 9, 27, 8, 0, 0)
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
        { dataset_id: 'carto.abc.dataset1', expires_at: '2020-09-27 08:00:00 +0000' }
      ].to_json
      
      bigtable_redis = [
        { dataset_id: 'carto.abc.dataset1', expires_at: '2020-09-27 08:00:00 +0000' }
      ].to_json

      @service.subscribe(@dataset)
      $users_metadata.hget(@redis_key, 'bq').should eq bq_redis
      $users_metadata.hget(@redis_key, 'bigtable').should eq bigtable_redis
    end

    it 'allows to add more data in the same Redis key' do
      @central_mock.stubs(:create_do_datasets)

      new_dataset = { dataset_id: 'carto.abc.dataset3', available_in: ['bq'], price: 300,
          expires_at: '2020-09-27 08:00:00 +0000' }

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
    end

    after(:each) do
      Cartodb::Central.unstub(:new)
    end

    it 'calls remove_do_dataset from Central with the expected parameters' do
      @central_mock.expects(:remove_do_dataset).once.with(username: 'fulano', id: @dataset_id)

      @service.unsubscribe(@dataset_id)
    end

    it 'removes the metadata from Redis' do
      @central_mock.stubs(:create_do_datasets)
      @central_mock.stubs(:remove_do_dataset)

      bq_datasets = [].to_json

      @service.subscribe(@dataset)
      @service.unsubscribe(@dataset_id)

      $users_metadata.hget(@redis_key, 'bq').should eq bq_datasets
    end
  end

end
