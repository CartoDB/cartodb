require 'resque/plugins/job_tracking'

module Resque
  class ImporterJobs
    extend Resque::Plugins::JobTracking

    @queue = :import_jobs

    def self.track(options)
      [User.where(:id => options.symbolize_keys[:user_id]).first.job_tracking_identifier]
    end

    def self.perform(meta_id, options)
      begin
        DataImport.create options.symbolize_keys.merge(:updated_at => Time.now, :queue_id => meta_id)
      rescue => e
        # TODO handle some common exceptions here
        raise e
      end
    end
  end
end
