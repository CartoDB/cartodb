# encoding: utf-8
require 'forwardable'
require 'virtus'
require 'json'
require_relative './collection'
require_relative './presenter'
require_relative './name_checker'
require_relative './relator'
require_relative '../table/privacy_manager'
require_relative '../../../services/minimal-validation/validator'
require_relative '../../../services/named-maps-api-wrapper/lib/named_maps_wrapper'

# Every table has always at least one visualization (the "canonical visualization"), of type 'table',
# which shares the same privacy options as the table and gets synced.
# Users can create new visualizations, which will never be of type 'table',
# and those will use named maps when any source tables are private
module CartoDB
  module Visualization
    class Member
      extend Forwardable
      include Virtus

      PRIVACY_PUBLIC    = 'public'    # published and listable in public user profile
      PRIVACY_PRIVATE   = 'private'   # not published (viz.json and embed_map should return 404)
      PRIVACY_LINK      = 'link'      # published but not listen in public profile
      PRIVACY_PROTECTED = 'password'  # published but password protected

      CANONICAL_TYPE  = 'table'
      DERIVED_TYPE    =  'derived'
      PRIVACY_VALUES  = [ PRIVACY_PUBLIC, PRIVACY_PRIVATE, PRIVACY_LINK, PRIVACY_PROTECTED ]
      TEMPLATE_NAME_PREFIX = 'tpl_'

      AUTH_DIGEST = '1211b3e77138f6e1724721f1ab740c9c70e66ba6fec5e989bb6640c4541ed15d06dbd5fdcbd3052b'
      TOKEN_DIGEST = '6da98b2da1b38c5ada2547ad2c3268caa1eb58dc20c9144ead844a2eda1917067a06dcb54833ba2'

      attribute :id,                  String
      attribute :name,                String
      attribute :map_id,              String
      attribute :active_layer_id,     String
      attribute :type,                String
      attribute :privacy,             String
      attribute :tags,                Array[String], default: []
      attribute :description,         String
      attribute :created_at,          Time
      attribute :updated_at,          Time
      attribute :encrypted_password,  String, default: nil
      attribute :password_salt,       String, default: nil

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
        if (type == CANONICAL_TYPE)
          # Each table has a canonical visualization which must have privacy synced
          self.privacy = privacy_text
        end
        # But as this method also notifies of changes in a table, must save always
        do_store(false)
        self
      end #store_using_table

      def valid?
        validator.validate_presence_of(name: name, privacy: privacy, type: type)
        validator.validate_in(:privacy, privacy, PRIVACY_VALUES)
        validator.validate_uniqueness_of(:name, available_name?)

        if (privacy == PRIVACY_PROTECTED)
          validator.validate_presence_of_with_custom_message(
            { encrypted_password: encrypted_password, password_salt: password_salt },
            "password can't be blank"
            )
        end

        validator.valid?
      end #valid?

      def fetch
        data = repository.fetch(id)
        raise KeyError if data.nil?
        self.attributes = data
        self
      end #fetch

      def delete(from_table_deletion=false)
        # Named map must be deleted before the map, or we lose the reference to it

        begin
          named_map = has_named_map?
          named_map.delete if named_map
        rescue NamedMapsWrapper::HTTPResponseError => exception
          # CDB-1964: Silence named maps API exception if deleting data to avoid interrupting whole flow
          raise exception unless from_table_deletion
        end

        invalidate_varnish_cache
        overlays.destroy
        layers(:base).map(&:destroy)
        layers(:cartodb).map(&:destroy)
        map.destroy if map
        table.destroy if (type == CANONICAL_TYPE && table && !from_table_deletion)
        repository.delete(id)
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }

        self
      end #delete

      # A visualization is linked to a table when it uses that table in a layergroup (but is not the canonical table)
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
        self.privacy_changed = true if ( privacy != @privacy && !@privacy.nil? )
        super(privacy)
      end #privacy=

      def public?
        privacy == PRIVACY_PUBLIC
      end #public?

      # TODO: Unused yet
      def public_with_link?
        privacy == PRIVACY_LINK
      end #public_with_link?

      def private?
        privacy == PRIVACY_PRIVATE
      end #private?

      def password_protected?
        privacy == PRIVACY_PROTECTED
      end #password_protected?

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
        sorted_table_names = related_tables.map(&:name).sort { |i, j| i <=> j }.join(',')
        "#{user.database_name}:#{sorted_table_names},#{id}"
      end #varnish_key

      def derived?
        type == DERIVED_TYPE
      end #derived?

      def table?
        type == CANONICAL_TYPE
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

      def invalidate_cache_and_refresh_named_map
        invalidate_varnish_cache

        if type != CANONICAL_TYPE   
          save_named_map()     
        end
      end #invalidate_cache_and_refresh_named_map

      def has_private_tables?
        has_private_tables = false
        related_tables.each { |table|
          has_private_tables |= (table.privacy == ::Table::PRIVATE)
        }
        has_private_tables
      end #has_private_tables

      def retrieve_named_map?
        return password_protected? || has_private_tables?
      end #retrieve_named_map?

      def has_named_map?
        data = named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.normalize_name(id))
        if data.nil?
          false
        else
          data
        end
      end #has_named_map?

      def password=(value)
        if (value && value.size > 0)
          @password_salt = generate_salt() if @password_salt.nil?
          @encrypted_password = password_digest(value, @password_salt)
        end
      end #password

      def has_password?
        ( !@password_salt.nil? && !@encrypted_password.nil? ) 
      end #has_password

      def is_password_valid?(password)
        raise CartoDB::InvalidMember unless ( privacy == PRIVACY_PROTECTED && has_password? )
        ( password_digest(password, @password_salt) == @encrypted_password )
      end #is_password_valid

      def remove_password
        @password_salt = nil
        @encrypted_password = nil
      end #remove_password

      # To be stored with the named map
      def make_auth_token
        digest = secure_digest(Time.now, (1..10).map{ rand.to_s() })
        10.times do
          digest = secure_digest(digest, TOKEN_DIGEST)
        end
        digest            
      end #make_auth_token

      def get_auth_token
        named_map = has_named_map?
        raise CartoDB::InvalidMember unless named_map

        tokens = named_map.template[:template][:auth][:valid_tokens]
        raise CartoDB::InvalidMember if tokens.size == 0
        tokens.first
      end #get_auth_token

      def supports_private_maps?
        if @user_data.nil? && !user.nil?
          @user_data = user.data
        end

        !@user_data.nil? && @user_data.include?(:actions) && @user_data[:actions].include?(:private_maps)
      end # supports_private_maps?

      private

      attr_reader   :repository, :name_checker, :validator
      attr_accessor :privacy_changed, :name_changed, :description_changed

      def do_store(propagate_changes=true)
        if (password_protected?)
          raise CartoDB::InvalidMember if not has_password?
        else
          remove_password()
        end

        # Warning, imports create by default private canonical visualizations
        if type != CANONICAL_TYPE && @privacy == PRIVACY_PRIVATE && privacy_changed && !supports_private_maps?
          raise CartoDB::InvalidMember
        end

        invalidate_varnish_cache if name_changed || privacy_changed || description_changed
        set_timestamps

        repository.store(id, attributes.to_hash)

        if (type == CANONICAL_TYPE)
          propagate_privacy_and_name_to(table) if table and propagate_changes
        else
          propagate_name_to(table) if table and propagate_changes
          save_named_map()
        end
      end #do_store

      def named_maps(force_init = false)
        if @named_maps.nil? || force_init
          @named_maps = CartoDB::NamedMapsWrapper::NamedMaps.new(
            {
              name:     user.nil? ? (@user_data.nil? ? '' : @user_data[:name]) : user.username,
              api_key:  user.nil? ? (@user_data.nil? ? '' : @user_data[:api_key]) : user.api_key
            },
            {
              domain:     Cartodb.config[:tiler]['internal']['domain'],
              port:       Cartodb.config[:tiler]['internal']['port'] || 443,
              protocol:   Cartodb.config[:tiler]['internal']['protocol'],
              verifycert: (Cartodb.config[:tiler]['internal']['verifycert'] rescue true),
              host:       (Cartodb.config[:tiler]['internal']['host'] rescue nil)
            },
            configuration
          )
        end
        @named_maps
      end #named_maps

      def save_named_map
        named_map = has_named_map?
        if retrieve_named_map?
            if named_map
              update_named_map(named_map)
             else
              create_named_map
            end
        else
          named_map.delete if named_map
        end
      end #save_named_map

      def create_named_map
        new_named_map = named_maps.create(self)
        return !new_named_map.nil?        
      end #create_named_map_if_proceeds

      def update_named_map(named_map_instance)
        named_map_instance.update(self)
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

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end #configuration

      def password_digest(password, salt)
        digest = AUTH_DIGEST
        10.times do
          digest = secure_digest(digest, salt, password, AUTH_DIGEST)
        end
        digest
      end #password_digest

      def generate_salt
        secure_digest(Time.now, (1..10).map{ rand.to_s() })
      end #generate_salt

      def secure_digest(*args)
        Digest::SHA256.hexdigest(args.flatten().join())
      end #secure_digest

    end # Member
  end # Visualization
end # CartoDB

