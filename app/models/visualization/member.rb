# encoding: utf-8
require 'ostruct'
require 'virtus'
require_relative './collection'
require_relative './presenter'
require_relative '../overlay/collection'

module CartoDB
  module Visualization
    class Member
      include Virtus

      LAYER_SCOPES = {
        base:     :base_layers,
        cartodb:  :data_layers,
        other:    :user_layers
      }

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
        Presenter.new(self, { full: false }).to_poro
      end #to_hash

      def delete
        overlays.destroy
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end #delete

      def overlays
        @overlays ||= Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      def map
        return OpenStruct.new unless map_id
        return OpenStruct.new unless defined?(Map)
        @map ||= Map.where(id: map_id).first || OpenStruct.new
      end #map

      def table
        return OpenStruct.new unless type == 'table'
        return OpenStruct.new unless defined?(Table)
        @table  ||= Table.where(map_id: map_id).first
      end #table

      def layers(kind)
        return [] unless map.id
        return map.send(LAYER_SCOPES.fetch(kind))
      end #layers

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

      private

      attr_reader :repository

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration
    end # Member
  end # Visualization
end # CartoDB

