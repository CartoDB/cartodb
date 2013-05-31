# encoding: utf-8
require 'ostruct'
require 'virtus'
require 'json'
require_relative './collection'
require_relative '../overlay/collection'
require_relative './presenter'
require_relative './vizjson'
require_relative '../table'
require_relative '../table/privacy_manager'
require_relative './stats'
require_relative './name_checker'

module CartoDB
  module Visualization
    class Member
      include Virtus

      PRIVACY_VALUES  = %w{ public private }
      LAYER_SCOPES    = {
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
      attribute :created_at,        Time
      attribute :updated_at,        Time

      def initialize(attributes={}, repository=Visualization.repository,
      name_checker=nil)
        super(attributes)
        @repository   = repository
        self.id       ||= @repository.next_id
        @name_checker = name_checker
        self.errors   = {}
      end #initialize

      def store
        raise CartoDB::InvalidMember unless self.valid?

        invalidate_varnish_cache if name_changed || privacy_changed
        set_timestamps
        repository.store(id, attributes.to_hash)
        propagate_privacy_and_name_to(table) if table
        self
      end #store

      def valid?
        validate_presence_of([:name, :privacy, :type])
        validate_available_name
        validate_privacy_in(PRIVACY_VALUES)

        errors.empty?
      end #valid?

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
        layers(:base).map(&:destroy)
        layers(:cartodb).map(&:destroy)
        map.destroy if map
        table.destroy if type == 'table' && table
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }
        self
      end #delete

      def name=(name)
        self.name_changed = true if name != @name && !@name.nil?
        super(name)
      end #name=

      def privacy=(privacy)
        privacy = privacy.downcase if privacy
        self.privacy_changed = true if privacy != @privacy && !@privacy.nil?
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
        ::Map.where(id: map_id).first
      end #map

      def user
        map.user if map
      end #user

      def table
        return nil unless defined?(::Table)
        ::Table.where(map_id: map_id).first 
      end #table

      def related_tables
        layers(:cartodb).flat_map(&:affected_tables).uniq
      end #related_tables

      def layers(kind)
        return [] unless map
        return map.send(LAYER_SCOPES.fetch(kind))
      end #layers

      def authorize?(user)
        user.maps.map(&:id).include?(map_id)
      end #authorize?

      def stats
        CartoDB::Visualization::Stats.new(self).to_poro
      end #stats

      def varnish_key
        "#{related_tables.map(&:name)
          .sort { |i, j| i <=> j }
          .join(',')},#{id}"
      end #varnish_key

      def full_errors
        errors.map { |attribute, message| "#{attribute} #{message}" }
      end #full_errors

      def derived?
        type == 'derived'
      end #derived?

      def table?
        type == 'table'
      end #table?

      attr_reader   :errors
      private

      attr_reader   :repository, :name_checker
      attr_writer   :errors
      attr_accessor :privacy_changed, :name_changed

      def invalidate_varnish_cache
        CartoDB::Varnish.new
          .purge("obj.http.X-Cache-Channel ~ #{varnish_key}:vizjson")
      end #invalidate_varnish_cache

      def propagate_privacy_and_name_to(table)
        return self unless table
        propagate_privacy_to(table) if privacy_changed
        propagate_name_to(table)    if name_changed
      end #propagate_privacy_and_name_to

      def propagate_privacy_to(table)
        Table::PrivacyManager.new(table)
          .set_from(self)
          .propagate_to_redis_and_varnish
        self
      end #propagate_privacy_to

      def propagate_name_to(table)
        table.name = self.name
        table.update(name: self.name)
        table.send(:update_name_changes)
        self
      end #propagate_name_to

      def set_timestamps
        self.created_at ||= Time.now.utc
        self.updated_at = Time.now.utc
        self
      end #set_timestamps

      def name_checker
        @name_checker ||NameChecker.new(user)
      end #name_cheker

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration

      def validate_presence_of(attributes)
        attributes.each do |attribute|
          value = self.send(attribute)
          if (value.nil? || value.empty?)
            @errors.store(attribute.to_sym, "can't be blank")
          end
        end
      end #validate_presence_of

      def validate_available_name
        return self unless name_changed && user
        unless name_checker.available?(name)
          @errors.store(:name, "is already taken")
        end
      end #validate_available_name

      def validate_privacy_in(values)
        unless values.include?(privacy)
          @errors.store(:privacy, "must be one of #{values.join(', ')}")
        end
      end #validate_privacy_in
    end # Member
  end # Visualization
end # CartoDB

