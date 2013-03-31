# encoding: utf-8
require 'sequel'
require 'uuidtools'

module CartoDB
  module Overlay
    class Repository
      TABLE = :overlays

      def initialize(db=Sequel.sqlite)
        @db = db
      end #initialize

      def store(key, data={})
        db[TABLE].insert(data)
      end #store

      def fetch(key)
        db[TABLE].where(id: key).first
      end #fetch

      def next_id
        UUIDTools::UUID.timestamp_create
      end #next_id

      private

      attr_reader :db
    end # Repository
  end # Visualization
end # CartoDB

