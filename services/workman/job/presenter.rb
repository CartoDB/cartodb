# encoding: utf-8
require 'json'

module Workman
  module Job
    class Presenter
      def initialize(job)
        @job = job
      end #initialize

      def as_json
        job.to_hash.to_json
      end #as_json

      private

      attr_reader :job
    end # Presenter
  end # Job
end # Workman

