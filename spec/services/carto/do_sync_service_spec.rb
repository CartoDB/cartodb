require 'spec_helper_min'

describe Carto::DoSyncService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @redis_key = "do:fulano:datasets"
    @service = Carto::DoSyncService.new(@user)
    @dataset_id = 'carto.abc.dataset1'
    @datasets = [
      { dataset_id: @dataset_id, available_in: ['bq', 'bigtable'], price: 100,
        expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
      { dataset_id: 'carto.abc.dataset2', available_in: ['bigtable'], price: 200,
        expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
    ]
  end

  after(:all) do
    @user.destroy
  end

  after(:each) do
    $users_metadata.del(@redis_key)
  end

  describe '#create_sync' do
    before(:each) do
      @central_mock = mock
      Cartodb::Central.stubs(:new).returns(@central_mock)
    end

    after(:each) do
      Cartodb::Central.unstub(:new)
      $users_metadata.del(@redis_key)
    end

    it 'creates a synchronization and enqueues a import job' do
      Resque::ImporterJobs.expects(:perform).once
      sync = nil
      expect {
        sync = @service.create_sync(@dataset_id)
        Carto::Synchronization.find(sync[:synchronization_id]).state.should eq Carto::Synchronization::STATE_QUEUED
      }.to change { Carto::Synchronization.count }.by 1
      @service.sync(@dataset_id)[:synchronization_id].should eq sync[:synchronization_id]
      # TODO: testing subscription_from_table_name requires imported table to be created/registered
      # @service.subscription_from_table_name(sync[:table_name]).should eq @dataset_id
    end
    # TODO: should not create synchronization for non-existing subscription
  end

end
