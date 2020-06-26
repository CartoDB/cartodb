module Carto
  class DoSyncService
    DO_SYNC_PROVIDER = 'do'.freeze
    DO_SYNC_INTERVAL = 86400

    def initialize(user)
      @user = user
    end

    # subscription -> existing sync; returns nil for invalid subscription or sync not created
    def sync(subscription_id)
      condition = %{
          service_name = 'connector'
          AND service_item_id::jsonb @> '{"provider":"#{DO_SYNC_PROVIDER}","subscription_id":"#{subscription_id}"}'::jsonb
      }
      data_import = Carto::DataImport.where(user_id: @user.id).where(condition).order('created_at desc').first
      if data_import
        state = case data_import.state
        when DataImport::STATE_ENQUEUED,  DataImport::STATE_PENDING, DataImport::STATE_UNPACKING,
          DataImport::STATE_IMPORTING, DataImport::STATE_UPLOADING
          'connecting'
        when DataImport::STATE_COMPLETE
          'connected'
        else
          'error'
        end
        bq = BqClient.new(@user.gcloud_settings[:service_account])
        views = subscription_views(subscription_id)
        num_bytes = 0
        num_rows = nil
        if views[:data]
          table = bq.table(views[:data])
          num_bytes += table.num_bytes # FIXME: num_physical_bytes ? num_long_term_bytes ?
          num_rows = table.num_rows
        end
        if views[:geography]
          num_bytes += bq.table(views[:geography]).num_bytes # FIXME: num_physical_bytes ? num_long_term_bytes ?
          num_rows ||= table.num_rows
        end
        # DO sync limits: Connector.limits(provider_name: DO_SYNC_PROVIDER, user: @user) ?
        # TODO: over_quota (num_bytes > user quota*k)
        # TODO: over_limits (num_bytes > user DO sync limit || num_rows > user DO sync limit)
        {
          sync_table: data_import.table_name, # empty while connecting
          sync_status: state,
          synchronization_id: data_import.synchronization_id,
          sync_table_id: data_import.table_id,
          estimated_num_bytes: num_bytes,
          estimated_num_rows: num_rows
        }
      end
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
    def create_sync(subscription_id, force=false)
      sync_data = sync(subscription_id)
      if sync_data.blank? || (force && sync_data[:sync_status] == 'error')
        create_new_sync_for_subscription! subscription_id
        # TODO: catch Over limits exception, etc. set persistent attribute over quota/size (where?)
        sync_data = sync(subscription_id)
      end
      sync_data
    end

    # stop sync'ing a subscription
    def remove_sync(subscription_id)
      sync_data = sync(subscription_id)
      if sync_data.present? && sync_data[:sync_status] != 'error' && sync_data[:synchronization_id].present?
        raise "Cannot remove sync while connecting" if sync_data[:sync_status] == 'connecting'
        # FIXME: should we also check the state of the synchronization?
        synchronization = CartoDB::Synchronization::Member.new(id: sync_data[:synchronization_id]).fetch
        synchronization.delete
      end
    end

    def subscription_view(subscription_id)
      gcloud_settings = @user.gcloud_settings
      subscriptions_project = gcloud_settings[:bq_project]
      subscriptions_dataset = gcloud_settings[:bq_dataset]
      subscription = @user.do_subscription('bq', @subscription_id)
      subscribed_project, subscribed_dataset, subscribed_table = subscription.values_at(:project, :dataset, :table)
      subscription_table = 'view_' + [subscribed_dataset, subscribed_table].join('_')
      [subscriptions_project, subscriptions_dataset, subscription_table].join('.')
    end

    def subscription_views(subscription_id)
      subscription = @user.do_subscription('bq', subscription_id)
      case subscription[:type]
      when 'dataset'
        data_view = subscription_view(subscription_id)
        do_api = DoApiClient.new(@user)
        geography_id = do_api.dataset(@subscription_id)['geography_id']
        if geography_id
          geography_view = subscription_view(geography_id)
        end
      when 'geography'
        geography_view = subscription_view(subscription_id)
      end
      {
        data: data_view,
        geography: geography_view
      }
    end

    private

    def create_new_sync_for_subscription!(subscription_id)
      table_name = temptative_table_name(subscription_id)
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

    def temptative_table_name(subscription_id)
      project, dataset, table = subscription_id.split('.')
      'do_sync_' + [dataset, table].join('_')
    end
  end
end
