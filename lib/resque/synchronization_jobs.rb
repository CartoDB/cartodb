require_relative './base_job'
require_relative '../../app/models/synchronization/member'

module Resque
  class SynchronizationJobs < BaseJob
    @queue = :synchronizations

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options| 
        CartoDB::Synchronization::Member.new(
          id: options.symbolize_keys[:job_id]
        ).fetch.run
      })
    end
  end
end
