module Carto
  class DoSyncService
    DO_SYNC_PROVIDER = 'do-v2'.freeze
    DO_SYNC_INTERVAL = 86400
    DOC_SYNC_MAX_BYTES = 1000000000 # TODO: this may need to be configurable per user
    DOC_SYNC_MAX_ROWS  = 10000000
    # PostgreSQL limits the number of columns per table to 1600 (https://www.postgresql.org/docs/12/limits.html)
    # We're leaving room here for a few columns added in joining to geography/cartodbfication
    DOC_SYNC_MAX_COLS  = 1596

    # Sync Attributes
    DO_SYNC_STATUS              = 'sync_status'.freeze
    DO_SYNC_UNSYNCABLE_REASON   = 'unsyncable_reason'.freeze
    DO_SYNC_UNSYNCED_ERRORS     = 'unsynced_errors'.freeze
    DO_SYNC_SYNCED_WARNINGS     = 'synced_warnings'.freeze
    DO_SYNC_TABLE               = 'sync_table'.freeze
    DO_SYNC_TABLE_ID            = 'sync_table_id'.freeze
    DO_SYNC_SYNCHRONIZATION_ID  = 'synchronization_id'.freeze
    DO_SYNC_ESTIMATED_SIZE      = 'estimated_size'.freeze
    DO_SYNC_ESTIMATED_ROW_COUNT = 'estimated_row_count'.freeze

    # Values of DO_SYNC_STATUS attribute
    DO_SYNC_STATUS_UNSYNCABLE   = 'unsyncable'.freeze
    DO_SYNC_STATUS_UNSYNCED     = 'unsynced'.freeze
    DO_SYNC_STATUS_SYNCING      = 'syncing'.freeze
    DO_SYNC_STATUS_SYNCED       = 'synced'.freeze

    def initialize(user)
      @user = user
    end

    # subscription -> existing sync; returns nil for invalid subscription or sync not created
    def sync(subscription_id)
      subscription = @user.do_subscription(subscription_id)

      if subscription.blank?
        return {
          DO_SYNC_STATUS => DO_SYNC_STATUS_UNSYNCABLE,
          DO_SYNC_UNSYNCABLE_REASON => "Invalid subscription #{subscription_id}"
        }.with_indifferent_access
      end

      if Time.now >= subscription['expires_at']
        return {
          DO_SYNC_STATUS => DO_SYNC_STATUS_UNSYNCABLE,
          DO_SYNC_UNSYNCABLE_REASON => "Subscription #{subscription_id} expired at #{subscription['expires_at']}"
        }.with_indifferent_access
      end

      views = subscription_views(subscription)
      bq = Carto::BqClient.new(billing_project: @user.gcloud_settings[:gcp_execution_project], key: @user.gcloud_settings[:service_account])

      num_bytes = 0
      num_rows = nil
      num_columns = nil
      if views[:data].present?
        table = bq.table(views[:data])
        num_bytes += table.num_bytes
        num_rows = table.num_rows
        num_columns = table.schema.fields.size
      end
      if views[:geography].present?
        table = bq.table(views[:geography])
        num_bytes += table.num_bytes
        num_rows ||= table.num_rows
        num_columns ||= table.schema.fields.size
      end

      limits_exceeded = []
      if num_columns > DOC_SYNC_MAX_COLS
        limits_exceeded << "Number of columns (#{num_columns}) exceeded the maximum (#{DOC_SYNC_MAX_COLS})"
      end
      if num_bytes > DOC_SYNC_MAX_BYTES
        limits_exceeded << "Number of bytes (#{num_bytes}) exceeded the maximum (#{DOC_SYNC_MAX_BYTES})"
      end
      if num_rows > DOC_SYNC_MAX_ROWS
        limits_exceeded << "Number of rows (#{num_rows}) exceeded the maximum (#{DOC_SYNC_MAX_ROWS})"
      end
      # TODO: take into consideration account quota limits too

      if limits_exceeded.present?
        return {
          DO_SYNC_STATUS => DO_SYNC_STATUS_UNSYNCABLE,
          DO_SYNC_UNSYNCABLE_REASON => limits_exceeded.join("\n")
        }.with_indifferent_access
      end

      sync_info = {
        DO_SYNC_STATUS => DO_SYNC_STATUS_UNSYNCED,
        DO_SYNC_ESTIMATED_SIZE => num_bytes,
        DO_SYNC_ESTIMATED_ROW_COUNT => num_rows
      }
      condition = %{
          id IN (
            -- only the most recent data import corresponding to this subscription is considered
            SELECT id FROM data_imports WHERE
              user_id = '#{@user.id}'
              AND service_name = 'connector'
              AND service_item_id::jsonb @> '{"provider":"#{DO_SYNC_PROVIDER}","subscription_id":"#{subscription_id}"}'::jsonb
            ORDER BY created_at DESC
            LIMIT 1
          )
          AND (
            -- either the table exists... (the synchronization might not exist if it's been stopped by user)
            EXISTS (SELECT id FROM user_tables WHERE user_tables.id = data_imports.table_id)
            OR
            -- ... or a synchronization exists (table may not exist if initial import hasn't finished)
            EXISTS (SELECT id FROM synchronizations WHERE synchronizations.id = data_imports.synchronization_id)
          )
      }
      data_import = Carto::DataImport.where(user_id: @user.id).where(condition).order('created_at desc').first
      if data_import
        case data_import.state
        when Carto::DataImport::STATE_ENQUEUED,  Carto::DataImport::STATE_PENDING, Carto::DataImport::STATE_UNPACKING,
          Carto::DataImport::STATE_IMPORTING, Carto::DataImport::STATE_UPLOADING
          sync_info[DO_SYNC_STATUS] = DO_SYNC_STATUS_SYNCING
        when DataImport::STATE_COMPLETE
          sync_info[DO_SYNC_STATUS] = DO_SYNC_STATUS_SYNCED
          sync_info[DO_SYNC_TABLE] = data_import.table_name
          sync_info[DO_SYNC_TABLE_ID] = data_import.table_id
          if Carto::Synchronization.find_by_id(data_import.synchronization_id)
            sync_info[DO_SYNC_SYNCHRONIZATION_ID] = data_import.synchronization_id
          end
          # TODO: data_import.id too?
          # TODO: we could add DO_SYNC_SYNCED_WARNINGS if synchronization has failed
        else
          sync_info[DO_SYNC_STATUS] = DO_SYNC_STATUS_UNSYNCED
          sync_info[DO_SYNC_UNSYNCED_ERRORS] = [data_import.error_code]
          # TODO: proper error message
          # but note that data_import.get_error_text is intended for UI imports and not approriate here
        end
      end

      sync_info.with_indifferent_access
    end

    # sync table name --> subscription_id; returns nil for non-subscription-sync table
    def subscription_from_sync_table(table_name)
      # This will not work untill the initial data import has finished
      table = Carto::UserTable.where(user_id: @user.id, name: table_name).first
      if table
        data_import = table.data_import
        if data_import && data_import.service_name == 'connector'
          params = JSON.parse(data_import.service_item_id)
          if params['provider'] == DO_SYNC_PROVIDER
            params['subscription_id']
          end
        end
      end
    end

    # create sync for subscription if it does not exist, or return existing sync
    def create_sync!(subscription_id, force=false)
      # TODO: tracking

      sync_data = sync(subscription_id)
      return sync_data unless sync_data[DO_SYNC_STATUS] == DO_SYNC_STATUS_UNSYNCED

      if force || sync_data[DO_SYNC_UNSYNCED_ERRORS].blank?
        create_new_sync_for_subscription! subscription_id
        sync_data = sync(subscription_id)
      end
      sync_data
    end

    # stop sync'ing a subscription
    def remove_sync!(subscription_id)
      # TODO: tracking, e.g. Carto::Tracking::Events::DeletedDataset.new(@user.id, ...).report

      sync_data = sync(subscription_id)
      raise "Cannot remove sync while syncing" if sync_data[DO_SYNC_STATUS] == DO_SYNC_STATUS_SYNCING
      # FIXME: should we also check the state of the synchronization? what if it's being synchronized?

      if sync_data[DO_SYNC_STATUS] == DO_SYNC_STATUS_SYNCED
        # Stop the synchronization and remove the table
        Carto::UserTable.find(sync_data[DO_SYNC_TABLE_ID]).visualization.destroy
      end
    end

    def subscription_views(subscription)
      return { data: nil, geography: nil } if subscription.blank? || subscription['expires_at'] <= Time.now

      case subscription[:type]
      when 'dataset'
        data_view = subscription_view(subscription)
        do_api = Carto::DoApiClient.new(@user)
        geography_id = do_api.dataset(subscription[:id])['geography_id']
        if geography_id
          geography_view = subscription_view(@user.do_subscription(geography_id))
        end
      when 'geography'
        geography_view = subscription_view(subscription)
      end
      {
        data: data_view,
        geography: geography_view
      }
    end

    private

    def subscription_view(subscription)
      gcloud_settings = @user.gcloud_settings
      subscriptions_project = gcloud_settings[:bq_project]
      subscriptions_dataset = gcloud_settings[:bq_dataset]
      subscribed_project, subscribed_dataset, subscribed_table = subscription.values_at(:project, :dataset, :table)
      subscription_table = 'view_' + [subscribed_dataset, subscribed_table].join('_')
      [subscriptions_project, subscriptions_dataset, subscription_table].join('.')
    end

    def create_new_sync_for_subscription!(subscription_id)
      table_name = tentative_table_name(subscription_id)
      connector_attributes = {
        provider: DO_SYNC_PROVIDER,
        subscription_id: subscription_id,
        import_as: table_name
      }
      member_attributes = {
        user_id: @user.id,
        state: CartoDB::Synchronization::Member::STATE_CREATED,
        service_name: 'connector',
        service_item_id: connector_attributes.to_json,
        interval: DO_SYNC_INTERVAL
      }
      member = CartoDB::Synchronization::Member.new(member_attributes)
      member.store

      options = member_attributes.slice(:user_id, :service_name, :service_item_id).merge(
        synchronization_id: member.id
      )
      data_import = ::DataImport.create(options)

      ::Resque.enqueue(::Resque::ImporterJobs, job_id: data_import.id)

      # Need to mark the synchronization job as queued state.
      # If this is missed there is an error state that can be
      # achieved where the synchronization job can never be
      # manually kicked off ever again.  This state will occur if the
      # resque job fails to mark the synchronization state to success or
      # failure (ie: resque never runs, or bug in ImporterJobs code)
      member.state = CartoDB::Synchronization::Member::STATE_QUEUED
      member.store
    end

    def tentative_table_name(subscription_id)
      project, dataset, table = subscription_id.split('.')
      'do_sync_' + [dataset, table].join('_')
    end
  end
end
