# encoding: utf-8
require 'forwardable'
require 'virtus'
require 'json'
require_relative './collection'
require_relative './presenter'
require_relative './vizjson'
require_relative './name_checker'
require_relative './relator'
require_relative '../table/privacy_manager'
require_relative '../../../services/minimal-validation/validator'
require_relative '../../../services/named-maps-api-wrapper/lib/named_maps_wrapper'

module CartoDB
  module Visualization
    class Member
      extend Forwardable
      include Virtus

      CANONICAL_TYPE = 'table'
      PRIVACY_VALUES  = %w{ public private }
      TEMPLATE_NAME_PREFIX = 'tpl_'

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

      def_delegators :validator,    :errors, :full_errors
      def_delegators :relator,      *Relator::INTERFACE

      def initialize(attributes={}, repository=Visualization.repository, name_checker=nil)
        super(attributes)
        @repository     = repository
        self.id         ||= @repository.next_id
        @name_checker   = name_checker
        @validator      = MinimalValidator::Validator.new
        @named_maps     = nil
        @user_data      = nil
      end #initialize

      def store
        raise CartoDB::InvalidMember unless self.valid?
        do_store
        self
      end #store

      def store_using_table(privacy_text)
        # Each table has a canonical visualization which must have privacy synced
        if (type == CANONICAL_TYPE)
          self.privacy = privacy_text
        end
        do_store
        self
      end #store_using_table

      def valid?
        validator.validate_presence_of(name: name, privacy: privacy, type: type)
        validator.validate_in(:privacy, privacy, PRIVACY_VALUES)
        validator.validate_uniqueness_of(:name, available_name?)
        validator.valid?
      end #valid?

      def fetch
        data = repository.fetch(id)
        raise KeyError if data.nil?
        self.attributes = data
        self
      end #fetch

      def delete
        # Named map must be deleted before the map, or we lose the reference to it
        named_map = has_named_map?
        named_map.delete if named_map

        invalidate_varnish_cache
        overlays.destroy
        layers(:base).map(&:destroy)
        layers(:cartodb).map(&:destroy)
        map.destroy if map
        table.destroy if type == 'table' && table
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }

        self
      end #delete

      def unlink_from(table)
        invalidate_varnish_cache
        remove_layers_from(table)
      end #unlink_from

      def user_data=(user_data)
        @user_data = user_data
        named_maps(true)
      end #user_data=

      def name=(name)
        name = name.downcase if name && table?
        self.name_changed = true if name != @name && !@name.nil?
        super(name)
      end #name=

      def description=(description)
        self.description_changed = true if description != @description && !@description.nil?
        super(description)
      end #description=

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

      def to_hash(options={})
        Presenter.new(self, options).to_poro
      end #to_hash

      def to_vizjson
        options = {
          full: false,
          user_name: user.username,
          user_api_key: user.api_key
        }
        VizJSON.new(self, options, configuration).to_poro
      end #to_hash

      def authorize?(user)
        user.maps.map(&:id).include?(map_id)
      end #authorize?

      def varnish_key
        "#{related_tables.map(&:name)
          .sort { |i, j| i <=> j }
          .join(',')},#{id}"
      end #varnish_key

      def derived?
        type == 'derived'
      end #derived?

      def table?
        type == 'table'
      end #table?

      def dependent?
        derived? && single_data_layer?
      end #dependent?

      def non_dependent?
        derived? && !single_data_layer?
      end #non_dependent?

      def invalidate_varnish_cache
        CartoDB::Varnish.new.purge("obj.http.X-Cache-Channel ~ .*#{id}:vizjson")
      end #invalidate_varnish_cache

      def has_private_tables?
        has_private_tables = false
        related_tables.each { |table|
          has_private_tables |= (table.privacy == ::Table::PRIVATE)
        }
        has_private_tables
      end #has_private_tables

      private

      attr_reader   :repository, :name_checker, :validator
      attr_accessor :privacy_changed, :name_changed, :description_changed

      def do_store
        invalidate_varnish_cache if name_changed || privacy_changed || description_changed
        set_timestamps
        repository.store(id, attributes.to_hash)

        if type == CANONICAL_TYPE
          propagate_privacy_and_name_to(table) if table
        else
          propagate_name_to(table) if table
          # Canonical visualizations don't have named map
          named_map = has_named_map?
          if has_private_tables?
              if (named_map)
                update_named_map(named_map)
               else
                create_named_map
              end
          else
            named_map.delete if named_map
          end
        end
      end #do_store

      def named_maps(force_init = false)
        if @named_maps.nil? || force_init
          @named_maps = CartoDB::NamedMapsWrapper::NamedMaps.new(
            {
              name:     user.nil? ? @user_data[:name] : user.username,
              api_key:  user.nil? ? @user_data[:api_key] : user.api_key
            },
            {
              domain:   Cartodb.config[:tiler]['private']['domain'],
              port:     Cartodb.config[:tiler]['private']['port'] || 443,
              protocol: Cartodb.config[:tiler]['private']['protocol']
            }
          )
        end
        @named_maps
      end #named_maps

      def has_named_map?
        named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.normalize_name(id))
      end #has_named_map?

      def create_named_map
        vizjson = VizJSON.new(self, { full: false, user_name: user.username }, configuration)
        template_data = {
          name: CartoDB::NamedMapsWrapper::NamedMap.normalize_name(id),
          auth: {
            method: 'open'
          },
          layergroup: vizjson.layer_group_for_named_map
        }
        new_named_map = named_maps.create(template_data)
        !new_named_map.nil?
      end #create_named_map_if_proceeds

      def update_named_map(named_map_instance)
        # Instance as param to avoid performing a second query to the NamedMaps API
        vizjson = VizJSON.new(self, { full: false, user_name: user.username }, configuration)
        template_data = {
          name: CartoDB::NamedMapsWrapper::NamedMap.normalize_name(id),
          auth: {
            method: 'open'
          },
          layergroup: vizjson.layer_group_for_named_map
        }
        named_map_instance.update(template_data)
      end #update_named_map

      def propagate_privacy_and_name_to(table)
        return self unless table
        propagate_privacy_to(table) if privacy_changed
        propagate_name_to(table)    if name_changed
      end #propagate_privacy_and_name_to

      def propagate_privacy_to(table)
        if type == CANONICAL_TYPE
          Table::PrivacyManager.new(table)
            .set_from(self)
            .propagate_to_redis_and_varnish
        end
        self
      end #propagate_privacy_to

      def propagate_name_to(table)
        table.name = self.name
        table.update(name: self.name)
        table.send(:update_name_changes)
        self
      end #propagate_name_to

      def set_timestamps
        self.created_at ||= Time.now
        self.updated_at = Time.now
        self
      end #set_timestamps

      def relator
        Relator.new(attributes)
      end #relator

      def name_checker
        @name_checker || NameChecker.new(user)
      end #name_cheker

      def available_name?
        return true unless user && name_changed
        name_checker.available?(name)
      end #available_name?

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration

      def remove_layers_from(table)
        related_layers_from(table).each { |layer|
          map.remove_layer(layer)
          layer.destroy
        }
        self.active_layer_id = layers(:cartodb).first.id
        store
      end #remove_layers_from

      def related_layers_from(table)
        layers(:cartodb).select do |layer|
          (layer.affected_tables.map(&:name) +
            [layer.options.fetch('table_name', nil)]
          ).include?(table.name)
        end
      end #related_layers_from

    end # Member
  end # Visualization
end # CartoDB

