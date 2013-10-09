# encoding: utf-8
require_relative '../../app/models/synchronization/member'

module Resque
  class SynchronizationJobs
    @queue = :synchronizations

    def self.perform(options={})
      CartoDB::Synchronization::Member.new(
        id: options.symbolize_keys[:job_id]
      ).fetch.run
    end
  end
end
