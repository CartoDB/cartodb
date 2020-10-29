require_relative './base_job'

module Resque
  class DoSampleJobs < BaseJob
    @queue = :imports

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options|
        data_import = DataImport[options.symbolize_keys[:job_id]]
        data_import.run_import!
        # TODO: tag imported table (data_import.table_name) as do-sample if succeeded and save also get_dataset_id associated to it
      })
    end
  end

  def self.get_dataset_id(data_import)
    service_item_id = data_import.service_item_id
    JSON.parse(service_item_id)['dataset_id']
  end
end
