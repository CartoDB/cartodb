# encoding: utf-8
require 'sequel'
require 'uuidtools'

module CartoDB
  module Visualization
    class Repository
      def initialize(db=Sequel.sqlite)
        @db = db
      end #initialize

      def store(key, data={})
        @db[:visualizations].insert(data)
      end #store

      def fetch(key)
        data = @db[:visualizations].where(id: key).first
      end #fetch

      def next_id
        UUIDTools::UUID.timestamp_create
      end #next_id
    end # Repository
  end # Visualization
end # CartoDB

