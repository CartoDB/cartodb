require 'resque/plugins/job_tracking'

module Resque
  class ImporterJobs
    extend Resque::Plugins::JobTracking

    @queue = :import_jobs

    def self.track(user_id, table_name, data_source, table_id = nil, append = false, migrate_table = nil, table_copy = nil, from_query = nil)
      [User.where(:id => user_id).first.job_tracking_identifier]
    end

    def self.perform(meta_id, user_id, table_name, data_source, table_id = nil, append = false, migrate_table = nil, table_copy = nil, from_query = nil)

      DataImport.create( :queue_id      => meta_id,
                         :user_id       => user_id,
                         :table_id      => table_id,
                         :table_name    => table_name,
                         :data_source   => data_source,
                         :updated_at    => Time.now,
                         :append        => append,
                         :migrate_table => migrate_table,
                         :table_copy    => table_copy,
                         :from_query    => from_query )
    end
  end
end
