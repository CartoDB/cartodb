require_relative './base_job'

module Resque
  class DoSyncJobs < BaseJob
    @queue = :imports

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options|
        data_import = DataImport[options.symbolize_keys[:job_id]]

        user = Carto::User.find(data_import.user_id)
        licensing_service = Carto::DoLicensingService.new(user.username)
        subscription_info = get_subscription_info(data_import)

        write_do_sync_status(subscription_info, data_import, licensing_service)
        begin
          data_import.run_import!
        ensure
          write_do_sync_status(subscription_info, data_import, licensing_service)
        end
      })
    end

    def self.write_do_sync_status(subscription_info, data_import, licensing_service)
      subscription  = licensing_service.subscription(subscription_info['subscription_id'])
      # Check if the subscription has been removed during the synchronization process:
      if subscription.nil?
        # Remove just-imported table...
        Carto::UserTable.find(data_import.table_id).visualization.destroy
        raise StandardError.new("Subscription not found after import! (tablename: #{data_import.table_name})")
      end

      status_name = 'syncing'
      unsyncable_reason = nil
      unsynced_errors = []
      if data_import.state == 'complete' && data_import.success == true then
        status_name = 'synced'
      elsif data_import.state != 'pending' then
        sync_info = licensing_service.get_sync_status(subscription[:dataset_id])
        status_name, unsyncable_reason, unsynced_errors = sync_info.values_at(:sync_status, :unsyncable_reason, :unsynced_errors)
      end

      licensing_service.add_to_redis(subscription.merge({
        sync_status: status_name,
        unsyncable_reason: unsyncable_reason,
        unsynced_errors: unsynced_errors,
        sync_table: data_import.table_name,
        sync_table_id: data_import.table_id,
        synchronization_id: data_import.synchronization_id
      }))
    end

    def self.get_subscription_info(data_import)
      service_item_id = data_import.service_item_id
      JSON.parse(service_item_id)
    end
  end
end
