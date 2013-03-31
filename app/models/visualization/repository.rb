# encoding: utf-8
require 'sequel'
require 'uuidtools'

module CartoDB
  module Visualization
    class Repository
      def initialize(relation=:visualizations, db=Sequel.sqlite)
        @relation = relation
        @db       = db
      end #initialize

      def collection(filter={})
        db[relation].where(filter)
      end #collection

      def store(key, data={})
        db[relation].insert(data)
      end #store

      def fetch(key)
        db[relation].where(id: key).first
      end #fetch

      def delete(key)
        db[relation].where(id: key).delete
      end #delete

      def next_id
        UUIDTools::UUID.timestamp_create
      end #next_id

      private

      attr_reader :relation, :db
    end # Repository
  end # Visualization
end # CartoDB

