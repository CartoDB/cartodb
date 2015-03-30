# encoding: utf-8
require 'forwardable'
require 'virtus'
require 'json'
require_relative '../markdown_render'
require_relative './presenter'
require_relative './name_checker'
require_relative '../permission'
require_relative './relator'
require_relative './like'
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
      include Virtus.model

      PRIVACY_PUBLIC       = 'public'        # published and listable in public user profile
      PRIVACY_PRIVATE      = 'private'       # not published (viz.json and embed_map should return 404)
      PRIVACY_LINK         = 'link'          # published but not listen in public profile
      PRIVACY_PROTECTED    = 'password'      # published but password protected

      TYPE_CANONICAL  = 'table'
      TYPE_DERIVED    = 'derived'
      TYPE_SLIDE      = 'slide'
      TYPE_REMOTE = 'remote'

      KIND_GEOM   = 'geom'
      KIND_RASTER = 'raster'

      PRIVACY_VALUES  = [ PRIVACY_PUBLIC, PRIVACY_PRIVATE, PRIVACY_LINK, PRIVACY_PROTECTED ]
      TEMPLATE_NAME_PREFIX = 'tpl_'

      PERMISSION_READONLY = CartoDB::Permission::ACCESS_READONLY
      PERMISSION_READWRITE = CartoDB::Permission::ACCESS_READWRITE

      DEFAULT_URL_OPTIONS = 'title=true&description=true&search=false&shareable=true&cartodb_logo=true&layer_selector=false&legends=false&scrollwheel=true&fullscreen=true&sublayer_options=1&sql='

      AUTH_DIGEST = '1211b3e77138f6e1724721f1ab740c9c70e66ba6fec5e989bb6640c4541ed15d06dbd5fdcbd3052b'
      TOKEN_DIGEST = '6da98b2da1b38c5ada2547ad2c3268caa1eb58dc20c9144ead844a2eda1917067a06dcb54833ba2'

      DEFAULT_OPTIONS_VALUE = '{}'

      # Upon adding new attributes modify also:
      # app/models/visualization/migrator.rb
      # services/data-repository/spec/unit/backend/sequel_spec.rb -> before do
      # spec/support/helpers.rb -> random_attributes_for_vis_member
      # app/models/visualization/presenter.rb
      attribute :id,                  String
      attribute :name,                String
      attribute :map_id,              String
      attribute :active_layer_id,     String
      attribute :type,                String
      attribute :privacy,             String
      attribute :tags,                Array[String], default: []
      attribute :description,         String
      attribute :license,             String
      attribute :source,              String
      attribute :title,               String
      attribute :created_at,          Time
      attribute :updated_at,          Time
      attribute :encrypted_password,  String, default: nil
      attribute :password_salt,       String, default: nil
      attribute :url_options,         String, default: DEFAULT_URL_OPTIONS
      attribute :user_id,             String
      attribute :permission_id,       String
      attribute :locked,              Boolean, default: false
      attribute :parent_id,           String, default: nil
      attribute :kind,                String, default: KIND_GEOM
      attribute :prev_id,             String, default: nil
      attribute :next_id,             String, default: nil
      # Don't use directly, use instead getter/setter "transition_options"
      attribute :slide_transition_options,  String, default: DEFAULT_OPTIONS_VALUE
      attribute :active_child,        String, default: nil

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
        self.permission_change_valid = true   # Changes upon set of different permission_id
        # this flag is passed to the table in case of canonical visualizations. It's used to say to the table to not touch the database and only change the metadata information, useful for ghost tables
        self.register_table_only = false
      end

      def self.remote_member(name, user_id, privacy, description, tags, license, source)
        Member.new({
          name: name,
          user_id: user_id,
          privacy: privacy,
          description: description,
          tags: tags,
          license: license,
          source: source,
          type: TYPE_REMOTE})
      end

      def update_remote_data(privacy, description, tags, license, source)
        changed = false
        if self.privacy != privacy
          changed = true
          self.privacy = privacy
        end
        if self.description != description
          changed = true
          self.description = description
        end
        if self.tags != tags
          changed = true
          self.tags = tags
        end
        if self.license != license
          changed = true
          self.license = license
        end
        if self.source != source
          changed = true
          self.source = source
        end
        changed
      end

      def transition_options
        ::JSON.parse(self.slide_transition_options).symbolize_keys
      end

      def transition_options=(value)
        self.slide_transition_options = ::JSON.dump(value.nil? ? DEFAULT_OPTIONS_VALUE : value)
      end

      def ==(other_vis)
        self.id == other_vis.id
      end

      def default_privacy(owner)
        owner.try(:private_tables_enabled) ? PRIVACY_LINK : PRIVACY_PUBLIC
      end

      def store
        raise CartoDB::InvalidMember.new(validator.errors) unless self.valid?
        do_store
        self
      end

      def store_from_map(fields)
        self.map_id = fields[:map_id]
        do_store(false)
        self
      end

      def store_using_table(fields, table_privacy_changed=false)
        if type == TYPE_CANONICAL
          # Each table has a canonical visualization which must have privacy synced
          self.privacy = fields[:privacy_text]
          self.map_id = fields[:map_id]
        end
        # But as this method also notifies of changes in a table, must save always
        do_store(false, table_privacy_changed)
        self
      end

      def valid?
        validator.validate_presence_of(name: name, privacy: privacy, type: type, user_id: user_id)
        validator.validate_in(:privacy, privacy, PRIVACY_VALUES)
        # do not validate names for slides, it's never used
        validator.validate_uniqueness_of(:name, available_name?) unless type_slide?

        if privacy == PRIVACY_PROTECTED
          validator.validate_presence_of_with_custom_message(
            { encrypted_password: encrypted_password, password_salt: password_salt },
            "password can't be blank"
            )
        end

        # Allow only "maintaining" privacy link for everyone but not setting it
        if privacy == PRIVACY_LINK && privacy_changed
          validator.validate_expected_value(:private_tables_enabled, true, user.private_tables_enabled)
        end

        if type_slide?
          if parent_id.nil?
            validator.errors.store(:parent_id, "Type #{TYPE_SLIDE} must have a parent") if parent_id.nil?
          else
            begin
              parent_member = Member.new(id:parent_id).fetch
              if parent_member.type != TYPE_DERIVED
                validator.errors.store(:parent_id, "Type #{TYPE_SLIDE} must have parent of type #{TYPE_DERIVED}")
              end
            rescue KeyError
              validator.errors.store(:parent_id, "Type #{TYPE_SLIDE} has non-existing parent id")
            end
          end
        else
          validator.errors.store(:parent_id, "Type #{type} must not have parent") unless parent_id.nil?
        end

        unless permission_id.nil?
          validator.errors.store(:permission_id, 'Cannot modify permission') unless permission_change_valid
        end

        validator.valid?
      end

      def fetch
        data = repository.fetch(id)
        raise KeyError if data.nil?
        self.attributes = data
        self.name_changed = false
        self.privacy_changed = false
        self.description_changed = false
        self.permission_change_valid = true
        validator.reset
        self
      end

      def delete(from_table_deletion=false)
        # Named map must be deleted before the map, or we lose the reference to it

        begin
          named_map = has_named_map?
          named_map.delete if named_map
        rescue NamedMapsWrapper::HTTPResponseError => exception
          # CDB-1964: Silence named maps API exception if deleting data to avoid interrupting whole flow
          unless from_table_deletion
            CartoDB.notify_exception(exception, { user: user })
          end
        end

        unlink_self_from_list!

        support_tables.delete_all

        invalidate_cache
        overlays.destroy
        layers(:base).map(&:destroy)
        layers(:cartodb).map(&:destroy)
        safe_sequel_delete {
          # "Mark" that this vis id is the destructor to avoid cycles: Vis -> Map -> relatedvis (Vis again)
          related_map = map
          related_map.being_destroyed_by_vis_id = id
          related_map.destroy
        } if map
        safe_sequel_delete { table.destroy } if (type == TYPE_CANONICAL && table && !from_table_deletion)
        safe_sequel_delete { children.map { |child|
                                            # Refetch each item before removal so Relator reloads prev/next cursors
                                            child.fetch.delete
                                          }
        }
        safe_sequel_delete { permission.destroy } if permission
        safe_sequel_delete { repository.delete(id) }
        self.attributes.keys.each { |key| self.send("#{key}=", nil) }

        self
      end

      # A visualization is linked to a table when it uses that table in a layergroup (but is not the canonical table)
      def unlink_from(table)
        invalidate_cache
        remove_layers_from(table)
      end

      def user_data=(user_data)
        @user_data = user_data
        named_maps(true)
      end

      def name=(name)
        name = name.downcase if name && table?
        self.name_changed = true if name != @name && !@name.nil?
        self.old_name = @name
        super(name)
      end

      def description=(description)
        self.description_changed = true if description != @description && !@description.nil?
        super(description)
      end

      def description_clean
        if description.present?
          description_md.strip_tags
        end
      end
      def description_md
        if description.present?
          renderer = MarkdownRenderer.new(no_images: true, no_styles: true) 
          markdown = Redcarpet::Markdown.new(renderer, extensions = {})
          markdown.render description 
        end
      end

      def permission_id=(permission_id)
        self.permission_change_valid = false
        self.permission_change_valid = true if (@permission_id.nil? || @permission_id == permission_id)
        super(permission_id)
      end

      def privacy=(privacy)
        privacy = privacy.downcase if privacy
        self.privacy_changed = true if ( privacy != @privacy && !@privacy.nil? )
        super(privacy)
      end #privacy=

      def public?
        privacy == PRIVACY_PUBLIC
      end

      def public_with_link?
        privacy == PRIVACY_LINK
      end

      def private?
        privacy == PRIVACY_PRIVATE and not organization?
      end

      def organization?
        privacy == PRIVACY_PRIVATE and permission.acl.size > 0
      end

      def password_protected?
        privacy == PRIVACY_PROTECTED
      end

      def to_hash(options={})
        presenter = Presenter.new(self, options.merge(real_privacy: true))
        options.delete(:public_fields_only) === true ? presenter.to_public_poro : presenter.to_poro
      end

      def redis_vizjson_key
        @vizjson_key ||= "visualization:#{id}:vizjson"
      end

      def to_vizjson
        redis_cached(redis_vizjson_key) do
          calculate_vizjson
        end
      end

      def is_owner?(user)
        user.id == user_id
      end

      # @param user User
      # @param permission_type String PERMISSION_xxx
      def has_permission?(user, permission_type)
        # TODO: Make checks mandatory after permissions migration
        return is_owner?(user) if permission_id.nil?
        is_owner?(user) || permission.is_permitted?(user, permission_type)
      end

      def users_with_permissions(permission_types)
        permission.users_with_permissions(permission_types)
      end

      def all_users_with_read_permission
        users_with_permissions([CartoDB::Visualization::Member::PERMISSION_READONLY, \
                                CartoDB::Visualization::Member::PERMISSION_READWRITE]) + [user]
      end

      def varnish_key
        sorted_table_names = related_tables.map{ |table|
          "#{user.database_schema}.#{table.name}"
        }.sort { |i, j|
          i <=> j
        }.join(',')
        "#{user.database_name}:#{sorted_table_names},#{id}"
      end

      def varnish_vizzjson_key
        ".*#{id}:vizjson"
      end

      def derived?
        type == TYPE_DERIVED
      end

      def table?
        type == TYPE_CANONICAL
      end

      def type_slide?
        type == TYPE_SLIDE
      end

      # TODO: Check if for type slide should return true also
      def dependent?
        derived? && single_data_layer?
      end

      # TODO: Check if for type slide should return true also
      def non_dependent?
        derived? && !single_data_layer?
      end


      def invalidate_cache
        invalidate_varnish_cache
        invalidate_redis_cache
        parent.invalidate_cache unless parent_id.nil?
      end

      def invalidate_cache_and_refresh_named_map
        invalidate_cache
        if type != TYPE_CANONICAL or organization?
          save_named_map
        end
      end

      def has_private_tables?
        has_private_tables = false
        related_tables.each { |table|
          has_private_tables |= table.privacy.private?
        }
        has_private_tables
      end

      def retrieve_named_map?
        password_protected? || has_private_tables?
      end

      def has_named_map?
        data = named_maps.get(CartoDB::NamedMapsWrapper::NamedMap.normalize_name(id))
        if data.nil?
          false
        else
          data
        end
      end

      def password=(value)
        if value && value.size > 0
          @password_salt = generate_salt if @password_salt.nil?
          @encrypted_password = password_digest(value, @password_salt)
        end
      end

      def has_password?
        ( !@password_salt.nil? && !@encrypted_password.nil? ) 
      end

      def is_password_valid?(password)
        raise CartoDB::InvalidMember unless ( privacy == PRIVACY_PROTECTED && has_password? )
        ( password_digest(password, @password_salt) == @encrypted_password )
      end

      def remove_password
        @password_salt = nil
        @encrypted_password = nil
      end

      # To be stored with the named map
      def make_auth_token
        digest = secure_digest(Time.now, (1..10).map{ rand.to_s })
        10.times do
          digest = secure_digest(digest, TOKEN_DIGEST)
        end
        digest            
      end

      def get_auth_tokens
        named_map = has_named_map?
        raise CartoDB::InvalidMember unless named_map

        tokens = named_map.template[:template][:auth][:valid_tokens]
        raise CartoDB::InvalidMember if tokens.size == 0
        tokens
      end

      def supports_private_maps?
        if @user_data.nil? && !user.nil?
          @user_data = user.data
        end

        !@user_data.nil? && @user_data.include?(:actions) && @user_data[:actions].include?(:private_maps)
      end

      # @param other_vis CartoDB::Visualization::Member|nil
      # Note: Changes state both of self, other_vis and other affected list items, but only reloads self & other_vis
      def set_next_list_item!(other_vis)
        repository.transaction do
          close_list_gap(other_vis)

          # Now insert other_vis after self
          unless other_vis.nil?
            if self.next_id.nil?
              other_vis.next_id = nil
            else
              other_vis.next_id = self.next_id
              next_item = next_list_item
              next_item.prev_id = other_vis.id
              next_item.store
            end
            self.next_id = other_vis.id
            other_vis.prev_id = self.id
            other_vis.store
                     .fetch
          end

          store
        end

        fetch
      end

      # @param other_vis CartoDB::Visualization::Member|nil
      # Note: Changes state both of self, other_vis and other affected list items, but only reloads self & other_vis
      def set_prev_list_item!(other_vis)
        repository.transaction do
          close_list_gap(other_vis)

          # Now insert other_vis after self
          unless other_vis.nil?
            if self.prev_id.nil?
              other_vis.prev_id = nil
            else
              other_vis.prev_id = self.prev_id
              prev_item = prev_list_item
              prev_item.next_id = other_vis.id
              prev_item.store
            end
            self.prev_id = other_vis.id
            other_vis.next_id = self.id
            other_vis.store
                     .fetch
          end

          store
        end
        fetch
      end

      def unlink_self_from_list!
        repository.transaction do
          unless self.prev_id.nil?
            prev_item = prev_list_item
            prev_item.next_id = self.next_id
            prev_item.store
          end
          unless self.next_id.nil?
            next_item = next_list_item
            next_item.prev_id = self.prev_id
            next_item.store
          end
          self.prev_id = nil
          self.next_id = nil
        end
      end

      # @param user_id String UUID of the actor that likes the visualization
      # @throws AlreadyLikedError
      def add_like_from(user_id)
        Like.create(actor: user_id, subject: id)
        reload_likes
        self
      rescue Sequel::DatabaseError => exception
        if exception.message =~ /duplicate key/i
          raise AlreadyLikedError
        else
          raise exception
        end
      end

      def remove_like_from(user_id)
        item = likes.select { |like| like.actor == user_id }
        item.first.destroy unless item.first.nil?
        reload_likes
        self
      end

      def liked_by?(user_id)
        !(likes.select { |like| like.actor == user_id }.first.nil?)
      end

      # @param viewer_user User
      def qualified_name(viewer_user=nil)
        if viewer_user.nil? || is_owner?(viewer_user)
          name
        else
          "#{user.sql_safe_database_schema}.#{name}"
        end
      end

      attr_accessor :register_table_only

      private

      attr_reader   :repository, :name_checker, :validator
      attr_accessor :privacy_changed, :name_changed, :old_name, :description_changed, :permission_change_valid

      def calculate_vizjson
        options = {
          full: false,
          user_name: user.username,
          user_api_key: user.api_key,
          user: user,
          viewer_user: user,
          dynamic_cdn_enabled: user != nil ? user.dynamic_cdn_enabled: false
        }
        VizJSON.new(self, options, configuration).to_poro
      end

      def redis_cached(key)
        value = redis_cache.get(key)
        if value.present?
          return JSON.parse(value, symbolize_names: true)
        else
          result = yield
          serialized = JSON.generate(result)
          redis_cache.setex(key, 24.hours.to_i, serialized)
          return result
        end
      end

      def redis_cache
        @redis_cache ||= $tables_metadata
      end

      def invalidate_redis_cache
        redis_cache.del(redis_vizjson_key)
      end

      def invalidate_varnish_cache
        CartoDB::Varnish.new.purge(varnish_vizzjson_key)
      end

      def close_list_gap(other_vis)
        reload_self = false

        if other_vis.nil?
          self.next_id = nil
          old_prev = nil
          old_next = nil
        else
          old_prev = other_vis.prev_list_item
          old_next = other_vis.next_list_item
        end

        # First close gap left by other_vis
        unless old_prev.nil?
          old_prev.next_id = old_next.nil? ? nil : old_next.id
          old_prev.store
          reload_self |= old_prev.id == self.id
        end
        unless old_next.nil?
          old_next.prev_id = old_prev.nil? ? nil : old_prev.id
          old_next.store
          reload_self |= old_next.id == self.id
        end

        fetch if reload_self
      end

      def do_store(propagate_changes=true, table_privacy_changed=false)
        if password_protected?
          raise CartoDB::InvalidMember.new('No password set and required') unless has_password?
        else
          remove_password
        end

        # Warning: imports create by default private canonical visualizations
        if type != TYPE_CANONICAL && @privacy == PRIVACY_PRIVATE && privacy_changed && !supports_private_maps?
          raise CartoDB::InvalidMember
        end

        invalidate_cache if name_changed || privacy_changed || description_changed || table_privacy_changed
        set_timestamps

        repository.store(id, attributes.to_hash)

        # Careful to not call Permission.save until after persisted the vis
        if permission.nil?
          perm = CartoDB::Permission.new
          perm.owner = user
          perm.entity = self
          perm.save
          @permission_id = perm.id
          # Need to save again
          repository.store(id, attributes.to_hash)
        end

        # when visualization turns private remove the acl
        if privacy == PRIVACY_PRIVATE && permission.acl.size > 0 && privacy_changed
          permission.clear
        end

        if type == TYPE_CANONICAL || type == TYPE_REMOTE
          if organization?
            save_named_map
          end
          propagate_privacy_and_name_to(table) if table and propagate_changes
        else
          save_named_map
          propagate_name_to(table) if !table.nil? and propagate_changes
        end
      end

      def named_maps(force_init = false)
        if @named_maps.nil? || force_init
          if user.nil?
            name_param = @user_data.nil? ? '' : @user_data[:name]
            api_key_param = @user_data.nil? ? '' : @user_data[:api_key]
          else
            name_param = user.username
            api_key_param = user.api_key
          end
          @named_maps = CartoDB::NamedMapsWrapper::NamedMaps.new(
            {
              name:     name_param,
              api_key:  api_key_param
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
      end

      def save_named_map
        named_map = has_named_map?
        if retrieve_named_map?
            if named_map
              update_named_map(named_map)
             else
              create_named_map
            end
        else
          # Privacy changed, remove the map
          named_map.delete if named_map
        end
      end

      def create_named_map
        new_named_map = named_maps.create(self)
        !new_named_map.nil?
      end

      def update_named_map(named_map_instance)
        named_map_instance.update(self)
      end

      def propagate_privacy_and_name_to(table)
        raise "Empty table sent to Visualization::Member propagate_privacy_and_name_to()" unless table
        propagate_privacy_to(table) if privacy_changed
        propagate_name_to(table)    if name_changed
      end

      def propagate_privacy_to(table)
        if type == TYPE_CANONICAL
          CartoDB::TablePrivacyManager.new(table)
            .set_from(self)
            .propagate_to_varnish
        end
        self
      end

      # @param table Table
      def propagate_name_to(table)
        table.name = self.name
        table.register_table_only = self.register_table_only
        table.update(name: self.name)
        if name_changed
          support_tables.rename(old_name, name, recreate_constraints=true, seek_parent_name=old_name)
        end
        self
      rescue => exception
        revert_name_change(old_name) if name_changed
        raise CartoDB::InvalidMember.new(exception.to_s)
      end

      def revert_name_change(previous_name)
        self.name = previous_name
        store
      rescue => exception
        raise CartoDB::InvalidMember.new(exception.to_s)
      end

      def set_timestamps
        self.created_at ||= Time.now
        self.updated_at = Time.now
        self
      end

      def relator
        Relator.new(attributes)
      end

      def name_checker
        @name_checker || NameChecker.new(user)
      end

      def available_name?
        return true unless user && name_changed
        name_checker.available?(name)
      end

      def remove_layers_from(table)
        related_layers_from(table).each { |layer|
          map.remove_layer(layer)
          layer.destroy
        }
        self.active_layer_id = layers(:cartodb).first.id
        store
      end

      def related_layers_from(table)
        layers(:cartodb).select do |layer|
          (layer.affected_tables.map(&:name) +
            [layer.options.fetch('table_name', nil)]
          ).include?(table.name)
        end
      end

      def configuration
        return {} unless defined?(Cartodb)
        Cartodb.config
      end

      def password_digest(password, salt)
        digest = AUTH_DIGEST
        10.times do
          digest = secure_digest(digest, salt, password, AUTH_DIGEST)
        end
        digest
      end

      def generate_salt
        secure_digest(Time.now, (1..10).map{ rand.to_s })
      end

      def secure_digest(*args)
        #noinspection RubyArgCount
        Digest::SHA256.hexdigest(args.flatten.join)
      end

      def safe_sequel_delete
        yield
      rescue Sequel::NoExistingObject => exception
        # INFO: don't fail on nonexistant object delete
        CartoDB.notify_exception(exception)
      end

    end
  end
end

