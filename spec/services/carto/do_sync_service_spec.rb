require 'spec_helper_min'

describe Carto::DoSyncService do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @service = Carto::DoSyncService.new(@user)

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

  after(:all) do
    @user.destroy
    @error_import.destroy
    @error_sync.destroy
    @synced_table.destroy
    @synced_import.destroy
    @synced_sync.destroy
  end

  after(:each) do
    $users_metadata.del(@redis_key)
  end

  describe '#sync' do
    it 'returns unsyced for inexistent subscription' do
      @service.sync(@non_subscribed_dataset_id)['sync_status'].should eq 'unsynced'
      # TODO:
      # @service.sync(@non_subscribed_dataset_id)['sync_status'].should eq 'unsyncable'
      # @service.sync(@non_subscribed_dataset_id)['unsyncable_reason'].should eq 'Subscription not found'
    end

    it 'returns unsyced for expired subscription' do
      @service.sync(@subscribed_expired_dataset_id)['sync_status'].should eq 'unsynced'
      # TODO:
      # @service.sync(@subscribed_expired_dataset_id)['sync_status'].should eq 'unsyncable'
      # @service.sync(@subscribed_expired_dataset_id)['unsyncable_reason'].should eq 'Subscription has expired'
    end

    it 'returns synced for valid subscription imported' do
      @service.sync(@subscribed_synced_dataset_id)['sync_status'].should eq 'synced'
      @service.sync(@subscribed_synced_dataset_id)['sync_table'].should eq @synced_table.name
      @service.sync(@subscribed_synced_dataset_id)['sync_table_id'].should eq @synced_table.id
      @service.sync(@subscribed_synced_dataset_id)['synchronization_id'].should eq @synced_sync.id
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
end
