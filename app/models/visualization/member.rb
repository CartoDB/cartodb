# encoding: utf-8
require 'ostruct'
require 'virtus'
require 'aequitas'
require 'json'
require_relative './collection'
require_relative '../overlay/collection'
require_relative './presenter'
require_relative './vizjson'
require_relative '../table'
require_relative '../table/privacy_manager'
require_relative './stats'

module CartoDB
  module Visualization
    class Member
      include Virtus
      include Aequitas

      LAYER_SCOPES = {
        base:     :user_layers,
        cartodb:  :data_layers
      }

      attribute :id,                String
      attribute :name,              String
      attribute :map_id,            Integer
      attribute :active_layer_id,   Integer
      attribute :type,              String
      attribute :privacy,           String
      attribute :tags,              Array[String], default: []
      attribute :description,       String

      validates_presence_of         :privacy
      validates_within              :privacy, set: ['public', 'private']

      def initialize(attributes={}, repository=Visualization.repository)
        super(attributes)
        @repository     = repository
        self.id         ||= @repository.next_id
      end #initialize

      def store
        raise CartoDB::InvalidMember unless self.valid?
        propagate_privacy_to(table) if table
        repository.store(id, attributes.to_hash)
        self
      end #store

      def store_using_table(privacy)
        self.privacy = privacy
        repository.store(id, attributes.to_hash)
        self
      end #store_using_table

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

      def privacy=(privacy)
        privacy = privacy.downcase if privacy
        super(privacy)
      end #privacy=

      def public?
        privacy == 'public'
      end #public?

      def private?
        !public?
      end #private?

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
        return nil unless defined?(::Table)
        ::Table.where(map_id: map_id).first 
      end #table

      def related_tables
        layers(:cartodb).flat_map(&:affected_tables).map(&:name)
      end #related_tables

      def layers(kind)
        return [] unless map.id
        return map.send(LAYER_SCOPES.fetch(kind))
      end #layers

      def authorize?(user)
        user.maps.map(&:id).include?(map_id)
      end #authorize?

      def stats
        CartoDB::Visualization::Stats.new(self).to_poro
      end #stats

      private

      attr_reader :repository

      def propagate_privacy_to(table)
        Table::PrivacyManager.new(table)
          .set_from(self)
          .propagate_to_redis_and_varnish
      end #propagate_privacy_to

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration
    end # Member
  end # Visualization
end # CartoDB

