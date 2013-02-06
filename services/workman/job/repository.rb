# encoding: utf-8

module Workman
  module Job
    class Repository
      def initialize
        @storage = Hash.new
      end #initialize

      def store(id, attributes)
        @storage.store(id.to_s, attributes)
      end #store

      def fetch(id)
        @storage.fetch(id.to_s)
      end #fetch

      private

      attr_reader :storage
    end # Repository
  end # Job
end # Workman

