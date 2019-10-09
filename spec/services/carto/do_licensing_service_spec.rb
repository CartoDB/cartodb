require 'spec_helper_min'

describe Carto::DoLicensingService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @service = Carto::DoLicensingService.new('fulano')
    @datasets = [
      { dataset_id: 'dataset1', available_in: ['bq', 'spanner'], price: 100,
        expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
      { dataset_id: 'dataset2', available_in: ['spanner'], price: 200,
        expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
    ]
  end

  after(:all) do
    @user.destroy
  end

  describe '#purchase' do
    before(:each) do
      @central_mock = mock
      Cartodb::Central.stubs(:new).returns(@central_mock)
    end

    after(:each) do
      Cartodb::Central.unstub(:new)
    end

    it 'calls create_do_datasets from Central with the expected parameters' do
      @central_mock.expects(:create_do_datasets).once.with(username: 'fulano', datasets: @datasets)

      @service.purchase(@datasets)
    end

    it 'stores the metadata in Redis' do
      @central_mock.stubs(:create_do_datasets)
      redis_key = "do:fulano:datasets"
      bq_datasets = [
        { dataset_id: 'dataset1', expires_at: Time.new(2020, 9, 27, 8, 0, 0) }
      ].to_json
      spanner_datasets = [
        { dataset_id: 'dataset1', expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
        { dataset_id: 'dataset2', expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
      ].to_json

      @service.purchase(@datasets)

      $users_metadata.hget(redis_key, 'bq').should eq bq_datasets
      $users_metadata.hget(redis_key, 'spanner').should eq spanner_datasets
    end
  end

end
