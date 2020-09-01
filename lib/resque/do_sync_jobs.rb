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
        subscription  = licensing_service.subscription(subscription_info['subscription_id'])

        write_do_sync_status(subscription, data_import, licensing_service)
        data_import.run_import!
        write_do_sync_status(subscription, data_import, licensing_service)
      })
    end

    def self.write_do_sync_status(subscription, data_import, licensing_service)
      status_name = 'syncing'
      if data_import.state == 'complete' then
        status_name = ((data_import.success == true)? 'synced' : 'unsyncable')
      elsif data_import.state == 'failure' then
        status_name = 'unsyncable'
      end

      licensing_service.add_to_redis(subscription.merge({
        sync_status: status_name,
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
