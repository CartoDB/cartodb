# encoding: utf-8
require 'ostruct'
require 'virtus'
require 'json'
require_relative './collection'
require_relative '../overlay/collection'
require_relative './presenter'
require_relative './vizjson'

module CartoDB
  module Visualization
    class Member
      include Virtus

      LAYER_SCOPES = {
        base:     :user_layers,
        cartodb:  :data_layers
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
        repository.store(id, attributes.to_hash)
        self
      end #store

      def fetch
        data = repository.fetch(id)
        raise KeyError if data.nil?
        self.attributes = data
        self
      end #fetch

      def delete
        overlays.destroy
        table.destroy if type == 'table' && table
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end #delete

      def to_hash
        Presenter.new(self).to_poro
      end #to_hash

      def to_vizjson
        options = { full: false, user_name: user.username }
        VizJSON.new(self, options, configuration).to_poro
      end #to_hash

      def overlays
        @overlays ||= Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      def map
        (@map ||= ::Map.where(id: map_id).first) || OpenStruct.new
      end #map

      def user
        map.user || OpenStruct.new
      end #user

      def table
        return nil unless defined?(Table)
        @table ||= ::Table.where(map_id: map_id).first 
      end #table

      def related_tables
        layers(:cartodb).flat_map(&:affected_tables).map(&:name)
      end #related_tables

      def layers(kind)
        return [] unless map.id
        return map.send(LAYER_SCOPES.fetch(kind))
      end #layers

      def public?
        return table.public? if type == 'table'
        return true 
      end #public?

      def privacy
        return 'PUBLIC' unless table && table.id
        return table.privacy_text
      end #privacy

      def authorize?(user)
        user.maps.map(&:id).include?(map_id)
      end #authorize?

      private

      attr_reader :repository

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration
    end # Member
  end # Visualization
end # CartoDB

