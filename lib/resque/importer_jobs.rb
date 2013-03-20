module Resque
  class ImporterJobs
    @queue = :imports

    def self.perform(options = {})
      DataImport[options.symbolize_keys[:job_id]].run_import!
    end

  end
end
