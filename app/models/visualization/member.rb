# encoding: utf-8
require 'virtus'
require_relative './collection'
require_relative '../overlay/collection'

module CartoDB
  module Visualization
    class Member
      include Virtus

      attribute :id,            String
      attribute :name,          String
      attribute :map_id,        Integer
      attribute :type,          String
      attribute :tags,          Array[String], default: []
      attribute :description,   String

      def initialize(attributes={}, repository=Visualization.repository)
        self.attributes = attributes
        @repository     = repository
        self.id         ||= @repository.next_id
      end #initialize

      def store
        data = attributes.to_hash
        data.delete(:tags)
        repository.store(id, data)
        self
      end #store

      def fetch
        result = repository.fetch(id)
        raise KeyError if result.nil?
        self.attributes = result
        self
      end #fetch

      def to_hash
        { 
          id:           id,
          name:         name,
          map_id:       map_id,
          type:         type,
          tags:         (tags || []).join(','),
          description:  description
        }.merge(table: table_data)
      end #to_hash

      def delete
        overlays.destroy
        repository.delete(id)
        self.attributes.keys.each { |k| self.send("#{k}=", nil) }
        self
      end #delete

      def overlays
        @overlays ||= Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      def map
        return nil unless map_id
        return nil unless defined?(Map)
        @map ||= Map.where(id: map_id).first
      end #map

      def table
        return nil unless type == 'table'
        return nil unless defined?(Table)
        @table  ||= Table.where(map_id: map_id).first
      end #table

      private

      attr_reader :repository

      def table_data
        return {} unless table
        {
          id:           table.id,
          privacy:      table.privacy,
          size:         table.table_size,
          row_count:    table.rows_counted,
          updated_at:   table.updated_at
        }
      end #table_data
    end # Member
  end # Visualization
end # CartoDB

