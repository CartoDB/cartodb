# encoding: utf-8
require 'forwardable'
require_relative './job'
require_relative './loader'

module CartoDB
  module Importer
    class Runner
      extend Forwardable

      def initialize(pg_options, filepath, loader=nil)
        self.job    = Job.new(filepath: filepath, pg_options: pg_options)
        self.loader = loader || Loader.new(job)
      end #initialize

      def run
        log "Importing file #{filepath}"
        loader.run(filepath)
        log "Loader exit code: #{loader.exit_code}"
        self
      end #run

      attr_reader :job

      private

      attr_accessor :loader
      attr_writer   :job

      def_delegators :job, :log, :id, :pg_options, :filepath
      def_delegators :loader, :exit_code
    end # Runner
  end # Importer
end # CartoDB

