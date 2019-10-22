require 'spec_helper_min'

describe Carto::DoLicensingService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @redis_key = "do:fulano:datasets"
    @service = Carto::DoLicensingService.new('fulano')
    @dataset_id = 'carto.abc.dataset1'
    @datasets = [
      { dataset_id: @dataset_id, available_in: ['bq', 'spanner'], price: 100,
        expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
      { dataset_id: 'carto.abc.dataset2', available_in: ['spanner'], price: 200,
        expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
    ]
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
      @central_mock.expects(:create_do_datasets).once.with(username: 'fulano', datasets: @datasets)

      @service.subscribe(@datasets)
    end

    it 'stores the metadata in Redis' do
      @central_mock.stubs(:create_do_datasets)

      bq_datasets = [
        { dataset_id: 'carto.abc.dataset1', expires_at: '2020-09-27 08:00:00 +0000' }
      ].to_json
      spanner_datasets = [
        { dataset_id: 'carto.abc.dataset1', expires_at: '2020-09-27 08:00:00 +0000' },
        { dataset_id: 'carto.abc.dataset2', expires_at: '2020-12-31 12:00:00 +0000' }
      ].to_json

      @service.subscribe(@datasets)

      $users_metadata.hget(@redis_key, 'bq').should eq bq_datasets
      $users_metadata.hget(@redis_key, 'spanner').should eq spanner_datasets
    end

    it 'allows to add more data in the same Redis key' do
      @central_mock.stubs(:create_do_datasets)

      more_datasets = [
        { dataset_id: 'carto.abc.dataset3', available_in: ['bq'], price: 300,
          expires_at: '2020-09-27 08:00:00 +0000' }
      ]

      @service.subscribe(@datasets)
      @service.subscribe(more_datasets)

      bq_datasets = JSON.parse($users_metadata.hget(@redis_key, 'bq'))
      spanner_datasets = JSON.parse($users_metadata.hget(@redis_key, 'spanner'))
      bq_datasets.count.should eq 2
      spanner_datasets.count.should eq 2
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
      spanner_datasets = [
        { dataset_id: 'carto.abc.dataset2', expires_at: '2020-12-31 12:00:00 +0000' }
      ].to_json

      @service.subscribe(@datasets)
      @service.unsubscribe(@dataset_id)

      $users_metadata.hget(@redis_key, 'bq').should eq bq_datasets
      $users_metadata.hget(@redis_key, 'spanner').should eq spanner_datasets
    end
  end

end
