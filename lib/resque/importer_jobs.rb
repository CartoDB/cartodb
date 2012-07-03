require 'resque-result'

module Resque
  class ImporterJobs
    extend Resque::Plugins::Result

    @queue = :import_jobs

    def self.perform(meta_id, user_id, data_source)
      DataImport.create(:queue_id    => meta_id,
                        :user_id     => user_id,
                        :data_source => data_source,
                        :updated_at  => Time.now)
    end

  end
end
