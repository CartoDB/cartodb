require 'spec_helper_min'

describe Carto::DoSyncServiceFactory do

  before(:all) do
    @user = FactoryGirl.create(:valid_user, username: 'fulano')
    @service = Carto::DoSyncServiceFactory.get_for_user(@user)
    if @service.present?
      @do_api_class = @service.do_api_class
      @bq_client_class = @service.bq_client_class
    else
      pending('requires db-connectors') unless @service.present?
    end
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    future = Time.now + 1.year
    past = Time.now - 1.day

    @non_subscribed_dataset_id = 'carto.abc.table1'
    @non_subscribed_geography_id = 'carto.abc.geography_table0'
    @subscribed_dataset_id = 'carto.abc.table2'
    @subscribed_geography_id = 'carto.abc.geography_table'
    @subscribed_expired_dataset_id = 'carto.abc.table3'
    @subscribed_synced_dataset_id = 'carto.abc.table4'
    @subscribed_syncing_dataset_id = 'carto.abc.table5'
    @subscribed_sync_error_dataset_id = 'carto.abc.table6'

    bq_datasets = [
      { dataset_id: @subscribed_dataset_id, expires_at: future },
      { dataset_id: @subscribed_geography_id, expires_at: future },
      { dataset_id: @subscribed_expired_dataset_id, expires_at: past },
      { dataset_id: @subscribed_synced_dataset_id, expires_at: future },
      { dataset_id: @subscribed_syncing_dataset_id, expires_at: future },
      { dataset_id: @subscribed_sync_error_dataset_id, expires_at: future }
    ]
    @redis_key = "do:#{@user.username}:datasets"
    $users_metadata.hset(@redis_key, 'bq', bq_datasets.to_json)

    gcloud_settings = {
      service_account: 'the-service-account',
      bq_public_project: 'bq-public-project',
      gcp_execution_project: 'bq-run-project',
      bq_project: 'bq-project',
      bq_dataset: 'bq-dataset',
      bq_bucket: 'bq-bucket'
    }
    @settings_redis_key = "do_settings:#{@user.username}"
    $users_metadata.hmset(@settings_redis_key, *gcloud_settings.to_a)

    metadata_gcloud_settings = {
      service_account: 'metadata-service-account'
    }
    @metadata_settings_redis_key = "do_settings:__metadata_reader"
    $users_metadata.hmset(@metadata_settings_redis_key, *metadata_gcloud_settings.to_a)

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
      service_item_id: %[{"subscription_id":"#{@subscribed_synced_dataset_id}"}]
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
      service_item_id: %[{"subscription_id":"#{@subscribed_syncing_dataset_id}"}]
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
      service_item_id: %[{"subscription_id":"#{@subscribed_sync_error_dataset_id}"}]
    )
  end

  after(:each) do
    $users_metadata.del(@redis_key)
    $users_metadata.del(@settings_redis_key)
    $users_metadata.del(@metadata_settings_redis_key)
    @error_import.destroy
    @error_sync.destroy
    @syncing_table.destroy
    @syncing_import.destroy
    @syncing_sync.destroy
    Carto::UserTable.find_by_id(@synced_table.id)&.destroy
    @synced_import.destroy
    Carto::Synchronization.find_by_id(@synced_sync.id)&.destroy
  end

  describe '#entity_info' do
    it 'returns info for an non-subscribed dataset' do
      do_metadata = {}
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@non_subscribed_dataset_id).returns(do_metadata)
      bq_mock = double
      bq_metadata = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname1', type: 'STRING'), double(name: 'colname2', type: 'STRING'), ]
        )
      )
      bq_mock = double
      allow(bq_mock).to receive(:table).with(@non_subscribed_dataset_id).and_return(bq_metadata)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      expected_info = {
        id: @non_subscribed_dataset_id,
        project: @non_subscribed_dataset_id.split('.')[0],
        dataset: @non_subscribed_dataset_id.split('.')[1],
        table: @non_subscribed_dataset_id.split('.')[2],
        type: 'dataset',
        num_bytes: 1000,
        estimated_row_count: 100,
        estimated_columns_count: 2
      }
      info = @service.entity_info(@non_subscribed_dataset_id)
      info.except(:estimated_size).should eq expected_info.with_indifferent_access
      info[:estimated_size].should be_between 500, 1000
    end

    it 'returns info for a non-subscribed geography' do
      do_metadata = {}
      expect_any_instance_of(@do_api_class).to receive(:geography).with(@non_subscribed_geography_id).returns(do_metadata)
      bq_metadata = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname1', type: 'STRING'), double(name: 'geom', type: 'GEOGRAPHY'), ]
        )
      )
      bq_mock = double
      allow(bq_mock).to receive(:table).with(@non_subscribed_geography_id).and_return(bq_metadata)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      expected_info = {
        id: @non_subscribed_geography_id,
        project: @non_subscribed_geography_id.split('.')[0],
        dataset: @non_subscribed_geography_id.split('.')[1],
        table: @non_subscribed_geography_id.split('.')[2],
        type: 'geography',
        num_bytes: 1000,
        estimated_row_count: 100,
        estimated_columns_count: 2
      }

      info = @service.entity_info(@non_subscribed_geography_id)
      info.except(:estimated_size).should eq expected_info.with_indifferent_access
      info[:estimated_size].should be_between 500, 1000
    end

    it 'returns info for a dataset with geography' do
      do_dataset_metadata = {
        geography_id: @non_subscribed_geography_id
      }.with_indifferent_access
      do_geography_metadata = {}
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@non_subscribed_dataset_id).returns(do_dataset_metadata)
      bq_mock = double
      bq_dataset_metadata = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname1', type: 'STRING'), double(name: 'colname2', type: 'STRING'), ]
        )
      )
      bq_geography_metadata = double(
        num_bytes: 2000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'geom', type: 'GEOGRAPHY')]
        )
      )
      allow(bq_mock).to receive(:table).with(@non_subscribed_dataset_id).and_return(bq_dataset_metadata)
      allow(bq_mock).to receive(:table).with(@non_subscribed_geography_id).and_return(bq_geography_metadata)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      expected_info = {
        id: @non_subscribed_dataset_id,
        project: @non_subscribed_dataset_id.split('.')[0],
        dataset: @non_subscribed_dataset_id.split('.')[1],
        table: @non_subscribed_dataset_id.split('.')[2],
        type: 'dataset',
        num_bytes: 3000,
        estimated_row_count: 100,
        estimated_columns_count: 2
      }
      info = @service.entity_info(@non_subscribed_dataset_id)
      info.except(:estimated_size).should eq expected_info.with_indifferent_access
      info[:estimated_size].should be_between 1500, 3000
    end
  end

  describe '#subscription_views' do
    it 'returns data view for subscribed dataset' do
      dataset_metadata = {}
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns(dataset_metadata)

      subscription = @user.do_subscription(@subscribed_dataset_id)
      expected_views = {
        data_view: "bq-project.bq-dataset.view_abc_table2",
        data: @subscribed_dataset_id,
        geography: nil,
        geography_view: nil
      }
      @service.subscription_views(subscription).should eq expected_views
    end

    it 'returns data and geography views for subscribed dataset with geography' do
      dataset_metadata = {
        geography_id: @subscribed_geography_id
      }.with_indifferent_access
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns(dataset_metadata)
      # geography_metadata = {}
      # @do_api_class.any_instance.expects(:geography).with(@subscribed_geography_id).returns(geography_metadata)

      subscription = @user.do_subscription(@subscribed_dataset_id)
      expected_views = {
        data_view: "bq-project.bq-dataset.view_abc_table2",
        data: @subscribed_dataset_id,
        geography_view: "bq-project.bq-dataset.view_abc_geography_table",
        geography: @subscribed_geography_id
      }
      @service.subscription_views(subscription).should eq expected_views
    end

    it 'returns geography view for subscribed geography' do
      geography_metadata = {}
      expect_any_instance_of(@do_api_class).to receive(:geography).with(@subscribed_geography_id).returns(geography_metadata)

      subscription = @user.do_subscription(@subscribed_geography_id)
      expected_views = {
        data_view: nil,
        data: nil,
        geography_view: "bq-project.bq-dataset.view_abc_geography_table",
        geography: @subscribed_geography_id
      }
      @service.subscription_views(subscription).should eq expected_views
    end

    it 'returns error message for expired dataset' do
      subscription = @user.do_subscription(@subscribed_expired_dataset_id)
      @service.subscription_views(subscription)[:error].should match /expired/i
    end

    it 'returns error message for invalid dataset' do
      subscription = @user.do_subscription(@non_subscribed_dataset_id)
      @service.subscription_views(subscription)[:error].should match /invalid/i
    end

    it 'returns the geography dataset instead of a view if it is public and not subscribed' do
      dataset_metadata = {
        geography_id: @unsubscribed_geography_id,
        is_public_data: true
      }.with_indifferent_access
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns(dataset_metadata)

      subscription = @user.do_subscription(@subscribed_dataset_id)
      expected_views = {
        data_view: "bq-project.bq-dataset.view_abc_table2",
        data: @subscribed_dataset_id,
        geography_view: @unsubscribed_geography_id,
        geography: @unsubscribed_geography_id
      }
      @service.subscription_views(subscription).should eq expected_views
    end

    it 'does not return any geography if it is not public and not subscribed' do
      dataset_metadata = {
        geography_id: @unsubscribed_geography_id,
        is_public_data: false
      }.with_indifferent_access
      expect_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns(dataset_metadata)

      subscription = @user.do_subscription(@subscribed_dataset_id)
      expected_views = {
        data_view: "bq-project.bq-dataset.view_abc_table2",
        data: @subscribed_dataset_id,
        geography_view: nil,
        geography: nil
      }
      @service.subscription_views(subscription).should eq expected_views
    end
  end

  describe '#sync' do
    it 'returns unsyncable for inexistent subscription' do
      @service.sync(@non_subscribed_dataset_id)['sync_status'].should eq 'unsyncable'
      @service.sync(@non_subscribed_dataset_id)['unsyncable_reason'].should eq "Invalid subscription #{@non_subscribed_dataset_id}"
    end

    it 'returns unsyncable for expired subscription' do
      sync_info = @service.sync(@subscribed_expired_dataset_id)
      sync_info['sync_status'].should eq 'unsyncable'
      sync_info['unsyncable_reason'].should match /Subscription #{@subscribed_expired_dataset_id} expired/
    end

    it 'returns unsyncable for dataset too big' do
      max_bytes = 1000
      allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      allow(@service).to receive(:max_bytes).and_return(max_bytes)
      bq_mock = double
      table_mock = double(
        num_bytes: max_bytes + 1,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(max_bytes + 1)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_dataset_id)
      sync_info['sync_status'].should eq 'unsyncable'
      sync_info['unsyncable_reason'].should match /Number of bytes \(#{max_bytes + 1}\) exceeds the maximum/im
    end

    it 'returns unsyncable for dataset with too many rows' do
      allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 1000000000000,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_dataset_id)
      sync_info['sync_status'].should eq 'unsyncable'
      sync_info['unsyncable_reason'].should match /Number of rows \(1000000000000\) exceeds the maximum/im
    end

    it 'returns unsyncable for dataset with too many columns' do
      allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]*1600
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_dataset_id)
      sync_info['sync_status'].should eq 'unsyncable'
      sync_info['unsyncable_reason'].should match /Number of columns \(1600\) exceeds the maximum/im
    end

    it 'returns unsyncable if user quota is exceeded' do
    allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
     bq_mock = double
     table_mock = double(
       num_bytes: 1000,
       num_rows: 100,
       schema: double(
         fields: [double(name: 'colname', type: 'STRING')]*1600
       )
     )
     allow(@user).to receive(:remaining_quota).and_return(999)
     allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
     allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

     sync_info = @service.sync(@subscribed_dataset_id)
     sync_info['sync_status'].should eq 'unsyncable'
     sync_info['unsyncable_reason'].should match /Number of columns \(1600\) exceeds the maximum/im
   end

    it 'reports all limits exceeded' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000000000000,
        num_rows: 1000000000000,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]*1600
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_dataset_id)
      sync_info['sync_status'].should eq 'unsyncable'
      sync_info['unsyncable_reason'].should match /Number of bytes \(1000000000000\) exceeds the maximum/im
      sync_info['unsyncable_reason'].should match /Number of rows \(1000000000000\) exceeds the maximum/im
      sync_info['unsyncable_reason'].should match /Number of columns \(1600\) exceeds the maximum/im
    end

    it 'returns unsynced for valid subscription' do
      allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_dataset_id)
      sync_info['sync_status'].should eq 'unsynced'
      sync_info['estimated_size'].should be_between 500, 1000
      sync_info['estimated_row_count'].should eq 100
    end

    it 'returns synced for valid subscription imported' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_synced_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_synced_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_synced_dataset_id)
      sync_info['sync_status'].should eq 'synced'
      sync_info['sync_table'].should eq @synced_table.name
      sync_info['sync_table_id'].should eq @synced_table.id
      sync_info['synchronization_id'].should eq @synced_sync.id
      sync_info['estimated_size'].should be_between 500, 1000
      sync_info['estimated_row_count'].should eq 100
      expected_subscription_info = {
        id: @subscribed_synced_dataset_id,
        type: 'dataset'
      }
      @service.subscription_from_sync_table(@synced_table.name).should eq expected_subscription_info
    end

    it 'returns synced even if synchronization is stopped' do
      allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_synced_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_synced_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      CartoDB::Synchronization::Member.new(id: @synced_sync.id).fetch.delete
      sync_info = @service.sync(@subscribed_synced_dataset_id)
      sync_info['sync_status'].should eq 'synced'
      sync_info['sync_table'].should eq @synced_table.name
      sync_info['sync_table_id'].should eq @synced_table.id
      sync_info['estimated_size'].should be_between 500, 1000
      sync_info['estimated_row_count'].should eq 100
      # Note that we don't embrace here the DataImport anomaly of not nullifying the synchronization foreign key
      sync_info['synchronization_id'].should be_nil
      expected_subscription_info = {
        id: @subscribed_synced_dataset_id,
        type: 'dataset'
      }
      @service.subscription_from_sync_table(@synced_table.name).should eq expected_subscription_info
    end

    it 'returns syncing for valid subscription being imported' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_syncing_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_syncing_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      @service.sync(@subscribed_syncing_dataset_id)['sync_status'].should eq 'syncing'
    end

    it 'returns unsynced for valid subscription failed importing' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_sync_error_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_sync_error_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync_info = @service.sync(@subscribed_sync_error_dataset_id)
      sync_info['sync_status'].should eq 'unsynced'
      sync_info['unsynced_errors'].should eq [@import_error_code]
      sync_info['estimated_size'].should be_between 500, 1000
      sync_info['estimated_row_count'].should eq 100
    end
  end

  describe '#subscription_from_sync_table' do
    it 'returns the subscription id given a sync table' do
      expected_subscription_info = {
        id: @subscribed_synced_dataset_id,
        type: 'dataset'
      }
      @service.subscription_from_sync_table('synced_table').should eq expected_subscription_info
    end

    it 'returns nil for an invalid sync table' do
      @service.subscription_from_sync_table('xyz').should be_nil
      @service.subscription_from_sync_table('error_table').should be_nil
    end
  end

  describe '#remove_sync!' do
    it 'removes syncs' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_synced_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_synced_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      expect{
        expect {
          @service.remove_sync!(@subscribed_synced_dataset_id)
        }.to change { Carto::UserTable.count }.by(-1)
      }.to change { Carto::Synchronization.count }.by(-1)
      @service.sync(@subscribed_synced_dataset_id)['sync_status'].should eq 'unsynced'
    end

    it 'does nothing for unsynced subscription' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

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
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

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
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_synced_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_synced_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync = nil
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_synced_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
      sync['sync_status'].should eq 'synced'
    end

    it 'does nothing for syncing subscriptions' do
       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_syncing_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_syncing_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

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

    it 'does nothing for subscriptions over limits' do
      # TODO: should raise exception?

       allow_any_instance_of(@do_api_class).to receive(:dataset).with(@subscribed_dataset_id).returns({})
      bq_mock = double
      table_mock = double(
        num_bytes: 1000000000000,
        num_rows: 100,
        schema: double(
          fields: [double(name: 'colname', type: 'STRING')]
        )
      )
      allow(@user).to receive(:remaining_quota).and_return(1000)
      allow(bq_mock).to receive(:table).with(@subscribed_dataset_id).and_return(table_mock)
      allow(@bq_client_class).to receive(:new).with(key: 'metadata-service-account').and_return(bq_mock)

      sync = nil
      expect{
        expect {
          sync = @service.create_sync!(@subscribed_dataset_id)
        }.to change { Carto::Synchronization.count }.by(0)
      }.to change { Carto::DataImport.count }.by(0)
      sync['sync_status'].should eq 'unsyncable'
    end
  end
end
