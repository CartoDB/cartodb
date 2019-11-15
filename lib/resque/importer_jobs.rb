require_relative './base_job'

module Resque
  class ImporterJobs < BaseJob
    @queue = :imports

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options| DataImport[options.symbolize_keys[:job_id]].run_import! })
    end
  end
end