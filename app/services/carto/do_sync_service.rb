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
        {
          sync_table: data_import.table_name, # empty while connecting
          sync_status: state,
          synchronization_id: data_import.synchronization_id,
          sync_table_id: data_import.table_id
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
        sync_data = sync(subscription_id)
      end
      sync_data
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
