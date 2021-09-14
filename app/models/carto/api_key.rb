require 'securerandom'
require './lib/api_key_grants_validator'
require_dependency 'carto/errors'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/oauth_provider/scopes/scopes'
require_dependency 'carto/api_key_permissions'

module Carto
  class ApiKey < ActiveRecord::Base

    include Carto::AuthTokenGenerator
    include ::MessageBrokerHelper

    REDIS_KEY_PREFIX = 'api_keys:'.freeze

    TYPE_REGULAR = 'regular'.freeze
    TYPE_MASTER = 'master'.freeze
    TYPE_DEFAULT_PUBLIC = 'default'.freeze
    TYPE_OAUTH = 'oauth'.freeze
    VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC, TYPE_OAUTH].freeze

    NAME_MASTER = 'Master'.freeze
    NAME_DEFAULT_PUBLIC = 'Default public'.freeze

    API_SQL       = 'sql'.freeze
    API_MAPS      = 'maps'.freeze
    API_DO        = 'do'.freeze

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
    validate :check_permissions, unless: :skip_role_setup
    validate :valid_master_key, if: :master?
    validate :valid_default_public_key, if: :default_public?

    after_create :setup_db_role, if: ->(k) { k.needs_setup? && !k.skip_role_setup }
    after_create :create_remote_do_api_key, if: ->(api_key) { api_key.master? }

    after_save { remove_from_redis(redis_key(token_was)) if token_changed? }
    after_save { invalidate_cache if token_changed? }
    after_save :add_to_redis, if: :valid_user?
    after_save :save_cdb_conf_info, unless: :skip_cdb_conf_info?
    after_save :regenerate_remote_do_api_key, if: ->(k) { k.master? && k.token_changed? }

    after_destroy :reassign_owner, :drop_db_role, if: ->(k) { k.needs_setup? && !k.skip_role_setup }
    after_destroy :remove_from_redis
    after_destroy :invalidate_cache
    after_destroy :remove_cdb_conf_info, unless: :skip_cdb_conf_info?
    after_destroy :destroy_remote_do_api_key, if: ->(api_key) { api_key.master? }

    scope :master, -> { where(type: TYPE_MASTER) }
    scope :default_public, -> { where(type: TYPE_DEFAULT_PUBLIC) }
    scope :regular, -> { where(type: TYPE_REGULAR) }
    scope :user_visible, -> { where(type: [TYPE_MASTER, TYPE_DEFAULT_PUBLIC, TYPE_REGULAR]) }
    scope :by_type, ->(types) { types.blank? ? user_visible : where(type: types) }
    scope :order_weighted_by_type, -> { order(TYPE_WEIGHTED_ORDER) }

    attr_accessor :skip_role_setup, :ownership_role_name
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
      over_regular_quota = CartoDB::QuotaChecker.new(user).will_be_over_regular_api_key_quota?
      raise CartoDB::QuotaExceeded.new('You have reached the limit of API keys for your plan') if over_regular_quota

      create!(
        user: user,
        type: TYPE_REGULAR,
        name: name,
        grants: grants
      )
    end

    def self.create_oauth_key!(user: Carto::User.find(scope_attributes['user_id']), name:, grants:, ownership_role_name:)
      create!(
        user: user,
        type: TYPE_OAUTH,
        name: name,
        grants: grants,
        ownership_role_name: ownership_role_name
      )
    end

    def self.new_from_hash(api_key_hash)
      new(
        id: api_key_hash[:id],
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

    def create_remote_do_api_key
      cartodb_central_topic.publish(
        :create_remote_do_api_key,
        { type: type, token: token, user_id: user_id, username: user.username }
      )
    end

    def regenerate_remote_do_api_key
      original_token, saved_token = token_change

      # Order of execution is not guaranteed, but since the token is different there's no danger
      # of race conditions
      cartodb_central_topic.publish(
        :destroy_remote_do_api_key,
        { token: original_token, user_id: user_id, username: user.username }
      )
      cartodb_central_topic.publish(
        :create_remote_do_api_key,
        { type: type, token: saved_token, user_id: user_id, username: user.username }
      )
    end

    def destroy_remote_do_api_key
      cartodb_central_topic.publish(
        :destroy_remote_do_api_key,
        { token: token, user_id: user_id, username: user.username }
      )
    end

    def revoke_permissions(table, revoked_permissions)
      Carto::TableAndFriends.apply(db_connection, table.database_schema, table.name) do |s, t, qualified_name|
        query = %{
          REVOKE #{revoked_permissions.join(', ')}
          ON TABLE #{qualified_name}
          FROM \"#{db_role}\"
        }
        db_run(query)

        tables = [{ schema: s, table_name: t }]
        user.db_service.sequences_for_tables(tables).each do |sequence|
          db_run("REVOKE ALL ON SEQUENCE #{sequence} FROM \"#{db_role}\"")
        end
      end
    end

    def granted_apis
      @granted_apis ||= process_granted_apis
    end

    def table_permissions
      @table_permissions_cache ||= process_table_permissions
      @table_permissions_cache.values
    end

    def schema_permissions
      @schema_permissions_cache ||= process_schema_permissions
      @schema_permissions_cache.values
    end

    def dataset_metadata_permissions
      @dataset_metadata_permissions ||= process_dataset_metadata_permissions
    end

    def data_observatory_permissions?
      granted_apis&.include?(API_DO)
    end

    def table_permissions_from_db
      query = %{
          WITH permissions AS (
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
                table_name
          ),
          ownership AS (
            SELECT
                n.nspname as table_schema,
                relname as table_name
            FROM pg_class
            JOIN pg_catalog.pg_namespace n ON n.oid = pg_class.relnamespace
            WHERE pg_catalog.pg_get_userbyid(relowner) = '#{db_role}'
          )
          SELECT
              p.table_name,
              p.table_schema,
              p.privilege_types,
              CASE WHEN o.table_name IS NULL THEN false
                  ELSE true
              END AS owner
          FROM permissions p
          LEFT JOIN ownership o ON (p.table_name = o.table_name AND p.table_schema = o.table_schema)
        }
      db_run(query).map do |line|
        TablePermissions.new(schema: line['table_schema'],
                             name: line['table_name'],
                             owner: line['owner'] == 't' ? true : false,
                             permissions: line['privilege_types'].split(','))
      end
    end

    def schema_permissions_from_db
      user.db_service.all_schemas_granted_hashed(db_role).map do |schema, permissions|
        SchemaPermissions.new(name: schema, permissions: permissions)
      end
    end

    def data_services
      @data_services ||= process_data_services
    end

    def user_data
      @user_data ||= process_user_data_grants
    end

    def data_observatory_datasets
      @data_observatory_datasets ||= process_data_observatory_datasets
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

    def data_observatory_datasets?
      data_observatory_datasets.present?
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
        "ALTER ROLE \"#{db_role}\" SET search_path TO #{user.db_service.build_search_path}",
      ]

      # This is GRANTED to the organizational role for organization users, and the PUBLIC users for non-orgs
      # We do not want to grant the organization role to the Api Keys, since that also opens access to the analysis
      # catalog and tablemetadata. To be more consistent, we should probably GRANT this to the organization public
      # user instead, but that has the downside of leaking quotas to the public.
      # This works for now, but if you are adding new permissions, please reconsider this decision.
      if user.organization_user?
        queries << "GRANT ALL ON FUNCTION \"#{user.database_schema}\"._CDB_UserQuotaInBytes() TO \"#{db_role}\""
      end
      if regular?
        queries << "GRANT \"#{db_role}\" TO \"#{user.database_username}\""
      end
      queries
    end

    def set_enabled_for_engine(new_user_attributes = nil)
      # We enable/disable API keys for engine usage by adding/removing them from Redis
      valid_user?(new_user_attributes) ? add_to_redis : remove_from_redis
    end

    def save_cdb_conf_info
      db_run("SELECT cartodb.cdb_conf_setconf('#{CDB_CONF_KEY_PREFIX}#{db_role}', '#{cdb_conf_info.to_json}');")
    end

    def remove_cdb_conf_info
      db_run("SELECT cartodb.CDB_Conf_RemoveConf('#{CDB_CONF_KEY_PREFIX}#{db_role}');")
    end

    def cdb_conf_info
      {
        username: user.username,
        permissions: data_services || [],
        ownership_role_name: effective_ownership_role_name || ''
      }
    end

    def skip_cdb_conf_info
      @skip_cdb_conf_info || false
    end

    def skip_cdb_conf_info?
      skip_cdb_conf_info.present?
    end

    def effective_ownership_role_name
      return if schema_permissions.all? { |s| s.permissions.empty? }
      ownership_role_name || oauth_access_token.try(:ownership_role_name)
    end

    def grant_ownership_role_privileges
      db_run("GRANT \"#{effective_ownership_role_name}\" TO \"#{db_role}\"") if effective_ownership_role_name.present?
    end

    def setup_table_permissions
      tables = []

      setup_permissions(table_permissions) do |tp|
        Carto::TableAndFriends.apply(db_connection, tp.schema, tp.name) do |schema, table_name, qualified_name|
          db_run("GRANT #{tp.permissions.join(', ')} ON TABLE #{qualified_name} TO \"#{db_role}\"")
          tables << { schema: schema, table_name: table_name }
        end
      end

      user.db_service.sequences_for_tables(tables).each do |sequence|
        db_run("GRANT USAGE, SELECT ON SEQUENCE #{sequence} TO \"#{db_role}\"")
      end

      schemas_from_granted_tables.each { |s| grant_usage_privileges_for_schema(s) }
    end

    private

    PASSWORD_LENGTH = 40

    def raise_unprocessable_entity_error(error)
      raise Carto::UnprocesableEntityError.new(/PG::Error: ERROR:  (.+)/ =~ error.message && $1 || 'Unexpected error')
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
      return table_permissions unless databases.try(:[], :tables).present?

      databases[:tables].each do |table|
        table_id = "#{table[:schema]}.#{table[:name]}"
        table_permissions[table_id] ||= Carto::TablePermissions.new(schema: table[:schema], name: table[:name])
        table_permissions[table_id].merge!(table[:permissions])
      end

      table_permissions
    end

    def process_schema_permissions
      schema_permissions = {}

      databases = grants.find { |v| v[:type] == 'database' }
      return schema_permissions unless databases.try(:[], :schemas).present?

      databases[:schemas].each do |schema|
        schema_id = schema[:name]
        schema_permissions[schema_id] ||= Carto::SchemaPermissions.new(name: schema[:name])
        schema_permissions[schema_id].merge!(schema[:permissions])
      end

      schema_permissions
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

    def process_dataset_metadata_permissions
      dataset_metadata_grants = grants.find { |v| v[:type] == 'database' }
      dataset_metadata_grants.try(:[], :table_metadata)
    end

    def process_data_observatory_datasets
      data_observatory_grants = grants.find { |v| v[:type] == 'data-observatory' }
      return if data_observatory_grants.blank?

      data_observatory_grants[:datasets]
    end

    def check_permissions
      # Only checks if no previous errors in JSON definition
      check_table_permissions
      check_schema_permissions
    end

    def check_table_permissions
      if errors[:grants].empty? && invalid_tables_permissions.any?
        errors.add(:grants, 'can only grant table permissions you have')
      end
    end

    def check_schema_permissions
      if errors[:grants].empty? && invalid_schemas_permissions.any?
        errors.add(:grants, 'can only grant schema permissions you have')
      end
    end

    def invalid_tables_permissions
      databases = grants.find { |v| v[:type] == 'database' }
      return [] unless databases.try(:[], :tables).present?

      allowed = user.db_service.all_tables_granted_hashed

      invalid = []
      databases[:tables].each do |table|
        if allowed[table[:schema]].nil? ||
           allowed[table[:schema]][table[:name]].nil? ||
           (table[:permissions] - allowed[table[:schema]][table[:name]]).any?
          invalid << table
        end
      end
      invalid
    end

    def invalid_schemas_permissions
      databases = grants.find { |v| v[:type] == 'database' }
      return [] unless databases.try(:[], :schemas).present?

      allowed = user.db_service.all_schemas_granted_hashed

      invalid = []
      databases[:schemas].each do |schema|
        invalid_schema = (schema[:permissions] - allowed[schema[:name]].to_a).any?
        invalid << schema if invalid_schema
      end
      invalid
    end

    def create_db_config
      begin
        self.db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
      end while self.class.exists?(user_id: user_id, db_role: db_role)
      self.db_password = SecureRandom.hex(PASSWORD_LENGTH / 2) unless db_password
    end

    def setup_db_role
      create_role
      setup_table_permissions
      setup_schema_permissions
      grant_ownership_role_privileges
    end

    def setup_schema_permissions
      setup_permissions(schema_permissions) do |sp|
        db_run("GRANT #{sp.permissions.join(', ')} ON SCHEMA \"#{sp.name}\" TO \"#{db_role}\"")
      end
    end

    def setup_permissions(permissions)
      non_existent = []
      errors = []
      permissions.each do |api_key_permission|
        next if api_key_permission.permissions.empty?
        begin
          # here we catch exceptions to show a proper error to the user request
          # this is because we allow OAuth requests to include a `datasets` or `schemas` scope with
          # tables or schema that may or may not exist
          yield api_key_permission
        rescue Carto::UnprocesableEntityError => e
          raise e unless e.message =~ /does not exist/
          non_existent << api_key_permission.name
          errors << e.message
        end
      end

      raise Carto::RelationDoesNotExistError.new(errors, non_existent) unless non_existent.empty?
    end

    def create_role
      (role_creation_queries + role_permission_queries).each { |q| db_run(q) }
    end

    def drop_db_role
      db_run("DROP OWNED BY \"#{db_role}\"")
      db_run("DROP ROLE IF EXISTS \"#{db_role}\"")
    end

    def reassign_owner
      db_run("REASSIGN OWNED BY \"#{db_role}\" TO \"#{user.database_username}\";")
    end

    def schemas_from_granted_tables
      # assume table friends don't introduce new schemas
      table_permissions.map(&:schema).uniq
    end

    def redis_key(token = self.token)
      "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
    end

    def remove_from_redis(key = redis_key)
      redis_client.del(key)
    end

    def db_run(query, connection = db_connection)
      connection.execute(query)
    rescue ActiveRecord::StatementInvalid => e
      log_warning(message: 'Error running SQL command', exception: e)
      return if e.message =~ /OWNED BY/ # role might not exist becuase it has been already dropped
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
      hash += ['data_observatory_datasets', data_observatory_datasets]
      hash
    end

    def redis_client
      $users_metadata
    end

    def grant_usage_privileges_for_schema(schema)
      db_run("GRANT USAGE ON SCHEMA \"#{schema}\" TO \"#{db_role}\"")
      db_run("GRANT ALL ON FUNCTION \"#{schema}\"._CDB_UserQuotaInBytes() TO \"#{db_role}\"")
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

    def valid_user?(new_user_attributes = {})
      new_user_attributes ||= {}
      user.engine_enabled = new_user_attributes[:engine_enabled] if new_user_attributes[:engine_enabled].present?
      user.state = new_user_attributes[:state] if new_user_attributes[:state].present?

      # This is not avalidation per-se, since we don't want to remove api keys when a user is disabled
      !(user.locked? || regular? && !user.engine_enabled?)
    end
  end
end
