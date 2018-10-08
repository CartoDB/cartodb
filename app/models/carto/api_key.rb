require 'securerandom'
require_dependency 'carto/errors'
require_dependency 'carto/helpers/auth_token_generator'

class ApiKeyGrantsValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return record.errors[attribute] = ['grants has to be an array'] unless value && value.is_a?(Array)
    record.errors[attribute] << 'only one apis section is allowed' unless value.count { |v| v[:type] == 'apis' } == 1

    max_one_sections = ['database', 'dataservices', 'user']
    max_one_sections.each do |section|
      if value.count { |v| v[:type] == section } > 1
        record.errors[attribute] << "only one #{section} section is allowed"
      end
    end
  end
end

module Carto
  class TablePermissions
    WRITE_PERMISSIONS = ['insert', 'update', 'delete', 'truncate'].freeze

    attr_reader :schema, :name, :permissions

    def initialize(schema:, name:, permissions: [])
      @schema = schema
      @name = name
      @permissions = permissions
    end

    def merge!(permissions)
      down_permissions = permissions.map(&:downcase)
      @permissions += down_permissions.reject { |p| @permissions.include?(p) }
    end

    def write?
      !(@permissions & WRITE_PERMISSIONS).empty?
    end
  end

  class ApiKey < ActiveRecord::Base

    include Carto::AuthTokenGenerator

    TYPE_REGULAR = 'regular'.freeze
    TYPE_MASTER = 'master'.freeze
    TYPE_DEFAULT_PUBLIC = 'default'.freeze
    TYPE_OAUTH = 'oauth'.freeze
    VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC, TYPE_OAUTH].freeze

    NAME_MASTER = 'Master'.freeze
    NAME_DEFAULT_PUBLIC = 'Default public'.freeze

    API_SQL       = 'sql'.freeze
    API_MAPS      = 'maps'.freeze

    GRANTS_ALL_APIS = { type: "apis", apis: [API_SQL, API_MAPS] }.freeze
    GRANTS_ALL_DATA_SERVICES = {
      type: 'dataservices',
      services: ['geocoding', 'routing', 'isolines', 'observatory']
    }.freeze
    GRANTS_ALL_USER_DATA = {
      type: 'user',
      data: ['profile']
    }.freeze

    MASTER_API_KEY_GRANTS = [GRANTS_ALL_APIS, GRANTS_ALL_DATA_SERVICES, GRANTS_ALL_USER_DATA].freeze

    TOKEN_DEFAULT_PUBLIC = 'default_public'.freeze

    TYPE_WEIGHTED_ORDER = "CASE WHEN type = '#{TYPE_MASTER}' THEN 3 " \
                          "WHEN type = '#{TYPE_DEFAULT_PUBLIC}' THEN 2 " \
                          "WHEN type = '#{TYPE_REGULAR}' THEN 1 " \
                          "ELSE 0 END DESC".freeze

    CDB_CONF_KEY_PREFIX = 'api_keys_'.freeze

    self.inheritance_column = :_type

    belongs_to :user
    has_one :oauth_access_token, inverse_of: :api_key

    before_create :create_token, if: ->(k) { k.needs_setup? && !k.token }
    before_create :create_db_config, if: ->(k) { k.needs_setup? && !(k.db_role && k.db_password) }

    serialize :grants, Carto::CartoJsonSymbolizerSerializer

    validates :grants, carto_json_symbolizer: true, api_key_grants: true, json_schema: true
    validates :type, inclusion: { in: VALID_TYPES }
    validates :type, uniqueness: { scope: :user_id }, unless: :needs_setup?
    validates :name, presence: true, uniqueness: { scope: :user_id }

    validate :valid_name_for_type
    validate :check_owned_table_permissions
    validate :valid_master_key, if: :master?
    validate :valid_default_public_key, if: :default_public?

    after_create :check_tables_exist, :setup_db_role, if: ->(k) { k.needs_setup? && !k.skip_role_setup }
    after_save { remove_from_redis(redis_key(token_was)) if token_changed? }
    after_save { invalidate_cache if token_changed? }
    after_save :add_to_redis, if: :valid_user?
    after_save :save_cdb_conf_info, unless: :skip_cdb_conf_info?

    after_destroy :drop_db_role, if: :needs_setup?
    after_destroy :remove_from_redis
    after_destroy :invalidate_cache
    after_destroy :remove_cdb_conf_info, unless: :skip_cdb_conf_info?

    scope :master, -> { where(type: TYPE_MASTER) }
    scope :default_public, -> { where(type: TYPE_DEFAULT_PUBLIC) }
    scope :regular, -> { where(type: TYPE_REGULAR) }
    scope :user_visible, -> { where(type: [TYPE_MASTER, TYPE_DEFAULT_PUBLIC, TYPE_REGULAR]) }
    scope :order_weighted_by_type, -> { order(TYPE_WEIGHTED_ORDER) }

    attr_accessor :skip_role_setup
    attr_writer :skip_cdb_conf_info

    private_class_method :new, :create, :create!

    def self.create_master_key!(user: Carto::User.find(scope_attributes['user_id']))
      create!(
        user: user,
        type: TYPE_MASTER,
        name: NAME_MASTER,
        token: user.api_key,
        grants: MASTER_API_KEY_GRANTS,
        db_role: user.database_username,
        db_password: user.database_password
      )
    end

    def self.create_default_public_key!(user: Carto::User.find(scope_attributes['user_id']))
      create!(
        user: user,
        type: TYPE_DEFAULT_PUBLIC,
        name: NAME_DEFAULT_PUBLIC,
        token: TOKEN_DEFAULT_PUBLIC,
        grants: [GRANTS_ALL_APIS],
        db_role: user.database_public_username,
        db_password: CartoDB::PUBLIC_DB_USER_PASSWORD
      )
    end

    def self.create_regular_key!(user: Carto::User.find(scope_attributes['user_id']), name:, grants:)
      create!(
        user: user,
        type: TYPE_REGULAR,
        name: name,
        grants: grants
      )
    end

    def self.create_oauth_key!(user: Carto::User.find(scope_attributes['user_id']), name:, grants:)
      create!(
        user: user,
        type: TYPE_OAUTH,
        name: name,
        grants: grants
      )
    end

    def self.new_from_hash(api_key_hash)
      new(
        created_at: api_key_hash[:created_at],
        db_password: api_key_hash[:db_password],
        db_role: api_key_hash[:db_role],
        name: api_key_hash[:name],
        token: api_key_hash[:token],
        type: api_key_hash[:type],
        updated_at: api_key_hash[:updated_at],
        grants: api_key_hash[:grants],
        user_id: api_key_hash[:user_id],
        skip_role_setup: true,
        skip_cdb_conf_info: true
      )
    end

    def granted_apis
      @granted_apis ||= process_granted_apis
    end

    def table_permissions
      @table_permissions_cache ||= process_table_permissions
      @table_permissions_cache.values
    end

    def table_permissions_from_db
      query = %{
        SELECT
          table_schema,
          table_name,
          string_agg(DISTINCT lower(privilege_type),',') privilege_types
        FROM
          information_schema.table_privileges tp
        WHERE
          tp.grantee = '#{db_role}'
        GROUP BY
          table_schema,
          table_name;
        }
      db_run(query).map do |line|
        TablePermissions.new(schema: line['table_schema'],
                             name: line['table_name'],
                             permissions: line['privilege_types'].split(','))
      end
    end

    def data_services
      @data_services ||= process_data_services
    end

    def user_data
      @user_data ||= process_user_data_grants
    end

    def regenerate_token!
      if master?
        # Send all master key updates through the user model, avoid circular updates
        ::User[user.id].regenerate_api_key
        reload
      else
        create_token
        save!
      end
    end

    def master?
      type == TYPE_MASTER
    end

    def default_public?
      type == TYPE_DEFAULT_PUBLIC
    end

    def regular?
      type == TYPE_REGULAR
    end

    def oauth?
      type == TYPE_OAUTH
    end

    def needs_setup?
      regular? || oauth?
    end

    def data_services?
      data_services.present?
    end

    def valid_name_for_type
      if !master? && name == NAME_MASTER || !default_public? && name == NAME_DEFAULT_PUBLIC
        errors.add(:name, "api_key name cannot be #{NAME_MASTER} nor #{NAME_DEFAULT_PUBLIC}")
      end
    end

    def can_be_deleted?
      regular?
    end

    def role_creation_queries
      ["CREATE ROLE \"#{db_role}\" NOSUPERUSER NOCREATEDB LOGIN ENCRYPTED PASSWORD '#{db_password}'"]
    end

    def role_permission_queries
      queries = [
        "GRANT \"#{user.service.database_public_username}\" TO \"#{db_role}\"",
        "ALTER ROLE \"#{db_role}\" SET search_path TO #{user.db_service.build_search_path}"
      ]

      # This is GRANTED to the organizational role for organization users, and the PUBLIC users for non-orgs
      # We do not want to grant the organization role to the Api Keys, since that also opens access to the analysis
      # catalog and tablemetadata. To be more consistent, we should probably GRANT this to the organization public
      # user instead, but that has the downside of leaking quotas to the public.
      # This works for now, but if you are adding new permissions, please reconsider this decision.
      if user.organization_user?
        queries << "GRANT ALL ON FUNCTION \"#{user.database_schema}\"._CDB_UserQuotaInBytes() TO \"#{db_role}\""
      end
      queries
    end

    def set_enabled_for_engine
      # We enable/disable API keys for engine usage by adding/removing them from Redis
      valid_user? ? add_to_redis : remove_from_redis
    end

    def save_cdb_conf_info
      info = {
        username: user.username,
        permissions: data_services || []
      }

      db_run("SELECT cartodb.cdb_conf_setconf('#{CDB_CONF_KEY_PREFIX}#{db_role}', '#{info.to_json}');")
    end

    def remove_cdb_conf_info
      db_run("SELECT cartodb.CDB_Conf_RemoveConf('#{CDB_CONF_KEY_PREFIX}#{db_role}');")
    end

    def skip_cdb_conf_info
      @skip_cdb_conf_info || false
    end

    def skip_cdb_conf_info?
      skip_cdb_conf_info.present?
    end

    private

    PASSWORD_LENGTH = 40

    REDIS_KEY_PREFIX = 'api_keys:'.freeze

    def raise_unprocessable_entity_error(error)
      raise Carto::UnprocesableEntityError.new(/PG::Error: ERROR:  (.+)/ =~ error.message && $1 || 'Unexpected error')
    end

    def check_tables_exist
      databases = grants.find { |v| v[:type] == 'database' }
      return unless databases.present?

      databases[:tables].each do |table|
        if (!check_table(table) && !check_view(table))
          raise Carto::UnprocesableEntityError.new("relation \"#{table[:schema]}.#{table[:name]}\" does not exist")
        end
      end
    end

    def check_table(table)
      begin
        result = db_run(%{
                   SELECT *
                   FROM
                     pg_tables
                   WHERE
                     schemaname = #{db_connection.quote(table[:schema])} AND
                     tablename = #{db_connection.quote(table[:name])}
                 })
      rescue StandardError => e
        raise_unprocessable_entity_error(e)
      end

      result && !result.count.zero?
    end

    def check_view(view)
      begin
        result = db_run(%{
                   SELECT *
                   FROM
                     pg_views
                   WHERE
                     schemaname = #{db_connection.quote(view[:schema])} AND
                     viewname = #{db_connection.quote(view[:name])}
                 })
      rescue StandardError => e
        raise_unprocessable_entity_error(e)
      end

      result && !result.count.zero?
    end

    def invalidate_cache
      return unless user
      user.invalidate_varnish_cache
    end

    def create_token
      begin
        self.token = generate_auth_token
      end while self.class.exists?(user_id: user_id, token: token)
    end

    def add_to_redis
      redis_client.hmset(redis_key, redis_hash_as_array)
    end

    def process_granted_apis
      apis = grants.find { |v| v[:type] == 'apis' }[:apis]
      raise UnprocesableEntityError.new('apis array is needed for type "apis"') unless apis
      apis
    end

    def process_table_permissions
      table_permissions = {}

      databases = grants.find { |v| v[:type] == 'database' }
      return table_permissions unless databases.present?

      databases[:tables].each do |table|
        table_id = "#{table[:schema]}.#{table[:name]}"
        table_permissions[table_id] ||= Carto::TablePermissions.new(schema: table[:schema], name: table[:name])
        table_permissions[table_id].merge!(table[:permissions])
      end

      table_permissions
    end

    def process_data_services
      data_services_grants = grants.find { |v| v[:type] == 'dataservices' }
      return nil unless data_services_grants.present?

      data_services_grants[:services]
    end

    def process_user_data_grants
      user_data_grants = grants.find { |v| v[:type] == 'user' }
      return nil unless user_data_grants.present?

      user_data_grants[:data]
    end

    def check_owned_table_permissions
      # Only checks if no previous errors in JSON definition
      if errors[:grants].empty? && table_permissions.any? { |tp| tp.schema != user.database_schema }
        errors.add(:grants, 'can only grant permissions over owned tables')
      end
    end

    def create_db_config
      begin
        self.db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
      end while self.class.exists?(user_id: user_id, db_role: db_role)
      self.db_password = SecureRandom.hex(PASSWORD_LENGTH / 2) unless db_password
    end

    def setup_db_role
      create_role

      table_permissions.each do |tp|
        unless tp.permissions.empty?
          Carto::TableAndFriends.apply(user_db_connection, tp.schema, tp.name) do |schema, table_name, qualified_name|
            user_db_run("GRANT #{tp.permissions.join(', ')}
                         ON TABLE #{qualified_name}
                         TO \"#{db_role}\"")
            sequences_for_table(schema, table_name).each do |seq|
              user_db_run("GRANT USAGE, SELECT ON SEQUENCE #{seq} TO \"#{db_role}\"")
            end
          end
        end
      end

      affected_schemas.each { |s| grant_aux_write_privileges_for_schema(s) }
    end

    def create_role
      (role_creation_queries + role_permission_queries).each { |q| db_run(q) }
    end

    def drop_db_role
      revoke_privileges
      db_run("DROP ROLE \"#{db_role}\"")
    end

    def affected_schemas
      # assume table friends don't introduce new schemas
      table_permissions.map(&:schema).uniq
    end

    def redis_key(token = self.token)
      "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
    end

    def remove_from_redis(key = redis_key)
      redis_client.del(key)
    end

    def sequences_for_table(schema, table)
      db_run(%{
        SELECT
          n.nspname, c.relname
        FROM
          pg_depend d
          JOIN pg_class c ON d.objid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE
          d.refobjsubid > 0 AND
          d.classid = 'pg_class'::regclass AND
          c.relkind = 'S'::"char" AND
          d.refobjid = (
            QUOTE_IDENT(#{db_connection.quote(schema)}) ||
            '.' ||
            QUOTE_IDENT(#{db_connection.quote(table)})
          )::regclass;
      }).map { |r| "\"#{r['nspname']}\".\"#{r['relname']}\"" }
    end

    def db_run(query, connection = db_connection)
      connection.execute(query)
    rescue ActiveRecord::StatementInvalid => e
      CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
      raise_unprocessable_entity_error(e)
    end

    def user_db_run(query)
      db_run(query, user_db_connection)
    end

    def db_connection
      @db_connection ||= user.in_database(as: :superuser)
    end

    def user_db_connection
      @user_db_connection ||= user.in_database
    end

    def redis_hash_as_array
      hash = ['user', user.username, 'type', type, 'database_role', db_role, 'database_password', db_password]
      granted_apis.each { |api| hash += ["grants_#{api}", true] }
      hash
    end

    def redis_client
      $users_metadata
    end

    def revoke_privileges
      affected_schemas.uniq.each do |schema|
        db_run("REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA \"#{schema}\" FROM \"#{db_role}\"")
        db_run("REVOKE USAGE ON SCHEMA \"#{schema}\" FROM \"#{db_role}\"")
        db_run("REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA \"#{schema}\" FROM \"#{db_role}\"")
      end

      if user.organization_user?
        db_run("REVOKE ALL ON FUNCTION \"#{user.database_schema}\"._CDB_UserQuotaInBytes() FROM \"#{db_role}\"")
      end
    end

    def grant_aux_write_privileges_for_schema(s)
      db_run("GRANT USAGE ON SCHEMA \"#{s}\" TO \"#{db_role}\"")
    end

    def valid_master_key
      errors.add(:name, "must be #{NAME_MASTER} for master keys") unless name == NAME_MASTER
      unless grants == MASTER_API_KEY_GRANTS
        errors.add(:grants, "must grant all apis")
      end
      errors.add(:token, "must match user model for master keys") unless token == user.api_key
    end

    def valid_default_public_key
      errors.add(:name, "must be #{NAME_DEFAULT_PUBLIC} for default public keys") unless name == NAME_DEFAULT_PUBLIC
      errors.add(:grants, "must grant all apis") unless grants == [GRANTS_ALL_APIS]
      errors.add(:token, "must be #{TOKEN_DEFAULT_PUBLIC} for default public keys") unless token == TOKEN_DEFAULT_PUBLIC
    end

    def valid_user?
      # This is not avalidation per-se, since we don't want to remove api keys when a user is disabled
      !(user.locked? || regular? && !user.engine_enabled?)
    end
  end
end
