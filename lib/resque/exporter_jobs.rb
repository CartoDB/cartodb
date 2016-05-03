# encoding: utf-8
require_relative './base_job'

module Resque
  class ExporterJobs < BaseJob
    @queue = :exports

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options|
        Carto::VisualizationExport.find(options.symbolize_keys[:job_id]).run_export!
      })
    end
  end
end
