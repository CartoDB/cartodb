require 'spec_helper_min'

describe Carto::DoSyncService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @service = Carto::DoSyncService.new(@user)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    future = Time.now + 1.year
    past = Time.now - 1.day

    @non_subscribed_dataset_id = 'carto.abc.table1'
    @subscribed_dataset_id = 'carto.abc.table2'
    @subscribed_expired_dataset_id = 'carto.abc.table3'
    @subscribed_synced_dataset_id = 'carto.abc.table4'
    @subscribed_syncing_dataset_id = 'carto.abc.table5'
    @subscribed_sync_error_dataset_id = 'carto.abc.table6'

    bq_datasets = [
      { dataset_id: @subscribed_dataset_id, expires_at: future },
      { dataset_id: @subscribed_expired_dataset_id, expires_at: past },
      { dataset_id: @subscribed_synced_dataset_id, expires_at: future },
      { dataset_id: @subscribed_syncing_dataset_id, expires_at: future },
      { dataset_id: @subscribed_sync_error_dataset_id, expires_at: future }
    ]
    @redis_key = "do:#{@user.username}:datasets"
    $users_metadata.hset(@redis_key, 'bq', bq_datasets.to_json)

    @synced_sync = FactoryGirl.create(
      :carto_synchronization,
      user_id: @user.id,
      name: 'synced_table',
      state: 'success'
    )
    @synced_import = FactoryGirl.create(
      :data_import,
      user_id: @user.id,
      table_name: 'synced_table',
      state: 'complete',
      synchronization_id: @synced_sync.id,
      service_name: 'connector',
      service_item_id: %[{"provider":"do-v2","subscription_id":"#{@subscribed_synced_dataset_id}"}]
    )
    @synced_table = FactoryGirl.create(
      :user_table,
      user_id: @user.id,
      name: 'synced_table',
      data_import_id: @synced_import.id
    )
    @synced_sync.update_attributes! visualization_id: Carto::UserTable.find(@synced_table.id).visualization.id

    @syncing_sync = FactoryGirl.create(
      :carto_synchronization,
      user_id: @user.id,
      name: 'syncing_table',
      state: 'queued'
    )
    @syncing_import = FactoryGirl.create(
      :data_import,
      user_id: @user.id,
      table_name: 'syncing_table',
      state: 'importing',
      synchronization_id: @syncing_sync.id,
      service_name: 'connector',
      service_item_id: %[{"provider":"do-v2","subscription_id":"#{@subscribed_syncing_dataset_id}"}]
    )
    @syncing_table = FactoryGirl.create(
      :user_table,
      user_id: @user.id,
      name: 'syncing_table',
      data_import_id: @syncing_import.id
    )

    @import_error_code = 12345
    @error_sync = FactoryGirl.create(
      :carto_synchronization,
      user_id: @user.id,
      name: 'error_table',
      state: 'success'
    )
    @error_import = FactoryGirl.create(
      :data_import,
      user_id: @user.id,
      table_name: 'error_table',
      state: 'failure',
      error_code: @import_error_code,
      synchronization_id: @error_sync.id,
      service_name: 'connector',
      service_item_id: %[{"provider":"do-v2","subscription_id":"#{@subscribed_sync_error_dataset_id}"}]
    )
  end

  after(:each) do
    $users_metadata.del(@redis_key)
    @error_import.destroy
    @error_sync.destroy
    @syncing_table.destroy
    @syncing_import.destroy
    @syncing_sync.destroy
    Carto::UserTable.find_by_id(@synced_table.id)&.destroy
    @synced_import.destroy
    Carto::Synchronization.find_by_id(@synced_sync.id)&.destroy
  end

  describe '#sync' do
    it 'returns unsycable for inexistent subscription' do
      @service.sync(@non_subscribed_dataset_id)['sync_status'].should eq 'unsyncable'
      @service.sync(@non_subscribed_dataset_id)['unsyncable_reason'].should eq "Invalid subscription #{@non_subscribed_dataset_id}"
    end

    it 'returns unsycable for expired subscription' do
      @service.sync(@subscribed_expired_dataset_id)['sync_status'].should eq 'unsyncable'
      @service.sync(@subscribed_expired_dataset_id)['unsyncable_reason'].should match /Subscription #{@subscribed_expired_dataset_id} expired/
    end

    it 'returns synced for valid subscription imported' do
      @service.sync(@subscribed_synced_dataset_id)['sync_status'].should eq 'synced'
      @service.sync(@subscribed_synced_dataset_id)['sync_table'].should eq @synced_table.name
      @service.sync(@subscribed_synced_dataset_id)['sync_table_id'].should eq @synced_table.id
      @service.sync(@subscribed_synced_dataset_id)['synchronization_id'].should eq @synced_sync.id
      @service.subscription_from_sync_table(@synced_table.name).should eq @subscribed_synced_dataset_id
    end

    it 'returns synced even if synchronization is stopped' do
      CartoDB::Synchronization::Member.new(id: @synced_sync.id).fetch.delete
      @service.sync(@subscribed_synced_dataset_id)['sync_status'].should eq 'synced'
      @service.sync(@subscribed_synced_dataset_id)['sync_table'].should eq @synced_table.name
      @service.sync(@subscribed_synced_dataset_id)['sync_table_id'].should eq @synced_table.id
      # Note that we don't embrace here the DataImport anomaly of not nullifying the synchronization foreign key
      @service.sync(@subscribed_synced_dataset_id)['synchronization_id'].should be_nil
      @service.subscription_from_sync_table(@synced_table.name).should eq @subscribed_synced_dataset_id
    end

    it 'returns syncing for valid subscription being imported' do
      @service.sync(@subscribed_syncing_dataset_id)['sync_status'].should eq 'syncing'
    end

    it 'returns unsynced for valid subscription failed importing' do
      @service.sync(@subscribed_sync_error_dataset_id)['sync_status'].should eq 'unsynced'
      @service.sync(@subscribed_sync_error_dataset_id)['unsynced_errors'].should eq [@import_error_code]
    end
  end

  describe '#subscription_from_sync_table' do
    it 'returns the subscription id given a sync table' do
      @service.subscription_from_sync_table('synced_table').should eq @subscribed_synced_dataset_id
    end

    it 'returns nil for an invalid sync table' do
      @service.subscription_from_sync_table('xyz').should be_nil
      @service.subscription_from_sync_table('error_table').should be_nil
    end
  end

  describe '#remove_sync!' do
    it 'removes syncs' do
      expect{
        expect {
          @service.remove_sync!(@subscribed_synced_dataset_id)
        }.to change { Carto::UserTable.count }.by(-1)
      }.to change { Carto::Synchronization.count }.by(-1)
      @service.sync(@subscribed_synced_dataset_id)['sync_status'].should eq 'unsynced'
    end

    it 'does nothing for unsynced subscription' do
      expect{
        @service.remove_sync!(@subscribed_dataset_id)
      }.to change { Carto::Synchronization.count }.by(0)
    end

    it 'raises error for syncinc subscription' do
      # TODO: should unsync in this case too?
      expect {
        @service.remove_sync!(@subscribed_syncing_dataset_id)
      }.to raise_exception StandardError
    end

    it 'does nothing for invalid subscription' do
      # TODO: should raise exception?
      expect{
        @service.remove_sync!(@non_subscribed_dataset_id)
      }.to change { Carto::Synchronization.count }.by(0)
    end
  end

  describe '#create_sync!' do
    it 'creates a synchronization and enqueues a import job' do
      Resque::ImporterJobs.expects(:perform).once
      sync = nil
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_dataset_id)
        }.to change { Carto::Synchronization.count }.by(1)
      }.to change { Carto::DataImport.count }.by(1)
      sync['sync_status'].should eq 'syncing'

      data_import = Carto::DataImport.where(user_id: @user.id).find do |data_import|
        data_import.service_name == 'connector' &&
          JSON.load(data_import.service_item_id)['subscription_id'] == @subscribed_dataset_id
      end
      data_import.should_not be_nil
      synchronization = Carto::Synchronization.find(data_import.synchronization_id)
      synchronization.state.should eq Carto::Synchronization::STATE_QUEUED

      synchronization.update! state: 'success', name: 'xyz'
      data_import.update! state: 'complete', table_name: 'xyz'
      @service.sync(@subscribed_dataset_id)['sync_status'].should eq 'synced'
      @service.sync(@subscribed_dataset_id)['sync_table'].should eq 'xyz'
      @service.sync(@subscribed_dataset_id)['synchronization_id'].should eq synchronization.id

      data_import.destroy
      synchronization.destroy
    end

    it 'does nothing for synced subscriptions' do
      sync = nil
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_synced_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
      sync['sync_status'].should eq 'synced'
    end

    it 'does nothing for syncing subscriptions' do
      sync = nil
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_syncing_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
      sync['sync_status'].should eq 'syncing'
    end

    it 'does nothing for expired subscriptions' do
      # TODO: should raise exception?
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_expired_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
    end

    it 'does nothing for invalid subscriptions' do
      # TODO: should raise exception?
      expect{
        expect {
          sync = @service.create_sync!(@non_subscribed_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
    end
  end
end
