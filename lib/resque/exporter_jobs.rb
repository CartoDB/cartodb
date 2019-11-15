require_relative './base_job'

module Resque
  class ExporterJobs < BaseJob
    @queue = :exports

    def self.perform(options = {})
      run_action(options, @queue, lambda do |options|
        download_path = options['download_path']
        Carto::VisualizationExport.find(options.symbolize_keys[:job_id]).run_export!(download_path: download_path)
      end)
    end
  end
end
