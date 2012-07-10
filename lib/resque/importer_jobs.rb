require 'resque-result'

module Resque
  class ImporterJobs
    extend Resque::Plugins::Result

    @queue = :import_jobs

    def self.perform(meta_id, user_id, table_name, data_source, table_id = nil, append = false, migrate_table = nil, table_copy = nil, from_query = nil)
      # 1. File
      # 2. URL
      # 3. APPEND
      # 4. RENAME
      # 5. DUPLICATE
      # 6. FROM QUERY
      # 7. TABLE COPY

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
