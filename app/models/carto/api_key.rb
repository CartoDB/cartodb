require 'securerandom'

class ApiKeyGrantsValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return record.errors[attribute] = ['grants has to be an array'] unless value && value.is_a?(Array)
    record.errors[attribute] << 'only one apis section is allowed' unless value.count { |v| v[:type] == 'apis' } == 1
    record.errors[attribute] << 'only one database section is allowed' if value.count { |v| v[:type] == 'database' } > 1
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
    TYPE_DEFAULT_PUBLIC = 'default_public'.freeze

    VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC].freeze

    self.inheritance_column = :_type

    belongs_to :user

    before_create :create_token
    before_create :create_db_config

    serialize :grants, Carto::CartoJsonSymbolizerSerializer
    validates :grants, carto_json_symbolizer: true, api_key_grants: true, json_schema: true

    validates :name, presence: true

    after_create :setup_db_role
    after_save { remove_from_redis(redis_key(token_was)) if token_changed? }
    after_save :add_to_redis
    after_save :update_role_permissions

    after_destroy :drop_db_role
    after_destroy :remove_from_redis

    validates :type, inclusion: { in: VALID_TYPES }

    attr_writer :redis_client

    def granted_apis
      @granted_apis ||= process_granted_apis
    end

    def table_permissions
      @table_permissions_cache ||= process_table_permissions
      @table_permissions_cache.values
    end

    def table_permissions_from_db
      query = %{
        select
          table_schema,
          table_name,
          string_agg(lower(privilege_type),',') privilege_types
        from
          information_schema.role_table_grants
        where
          grantee = '#{db_role}'
        group by
          table_schema,
          table_name;
        }
      db_connection.fetch(query).all.map do |line|
        TablePermissions.new(schema: line[:table_schema],
                             name: line[:table_name],
                             permissions: line[:privilege_types].split(','))
      end
    end

    def create_token
      begin
        self.token = generate_auth_token
      end while self.class.exists?(token: token)
    end

    private

    PASSWORD_LENGTH = 40

    REDIS_KEY_PREFIX = 'api_keys:'.freeze

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

    def create_db_config
      begin
        self.db_role = Carto::DB::Sanitize.sanitize_identifier("#{user.username}_role_#{SecureRandom.hex}")
      end while self.class.exists?(db_role: db_role)
      self.db_password = SecureRandom.hex(PASSWORD_LENGTH / 2) unless db_password
    end

    def setup_db_role
      db_run(
        "create role \"#{db_role}\" NOSUPERUSER NOCREATEDB NOINHERIT LOGIN ENCRYPTED PASSWORD '#{db_password}'"
      )
    end

    def drop_db_role
      revoke_privileges(*affected_schemas(table_permissions))
      db_run("drop role \"#{db_role}\"")
    end

    def update_role_permissions
      revoke_privileges(*affected_schemas(table_permissions_from_db))

      _, write_schemas = affected_schemas(table_permissions)

      table_permissions.each do |tp|
        unless tp.permissions.empty?
          db_run(
            "grant #{tp.permissions.join(', ')} on table \"#{tp.schema}\".\"#{tp.name}\" to \"#{db_role}\""
          )
        end
      end

      write_schemas.each { |s| grant_aux_write_privileges_for_schema(s) }

      if !write_schemas.empty?
        grant_usage_for_cartodb
      end
    end

    def affected_schemas(table_permissions)
      read_schemas = []
      write_schemas = []
      table_permissions.each do |tp|
        read_schemas << tp.schema
        write_schemas << tp.schema unless !tp.write?
      end
      [read_schemas.uniq, write_schemas.uniq]
    end

    def redis_key(token = self.token)
      "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
    end

    def add_to_redis
      redis_client.hmset(redis_key, redis_hash_as_array)
    end

    def remove_from_redis(key = redis_key)
      redis_client.del(key)
    end

    def db_run(query)
      db_connection.run(query)
    rescue Sequel::DatabaseError => e
      CartoDB::Logger.warning(message: 'Error running SQL command', exception: e)
      raise Carto::UnprocesableEntityError.new(/PG::Error: ERROR:  (.+)/ =~ e.message && $1 || 'Unexpected error')
    end

    def db_connection
      @user_db_connection ||= ::User[user.id].in_database(as: :superuser)
    end

    def redis_hash_as_array
      hash = ['user', user.username, 'type', type, 'dbRole', db_role, 'dbPassword', db_password]
      granted_apis.each { |api| hash += ["grants_#{api}", true] }
      hash
    end

    def redis_client
      @redis_client ||= $users_metadata
    end

    def revoke_privileges(read_schemas, write_schemas)
      schemas = read_schemas + write_schemas
      schemas << 'cartodb' if write_schemas.present?
      schemas.uniq.each do |schema|
        db_run("revoke all privileges on all tables in schema \"#{schema}\" from \"#{db_role}\"")
        db_run("revoke usage on schema \"#{schema}\" from \"#{db_role}\"")
        db_run("revoke execute on all functions in schema \"#{schema}\" from \"#{db_role}\"")
        db_run("revoke usage, select on all sequences in schema \"#{schema}\" from \"#{db_role}\"")
      end
      db_run("revoke usage on schema \"cartodb\" from \"#{db_role}\"")
      db_run("revoke execute on all functions in schema \"cartodb\" from \"#{db_role}\"")
    end

    def grant_usage_for_cartodb
      db_run("grant usage on schema \"cartodb\" to \"#{db_role}\"")
      db_run("grant execute on all functions in schema \"cartodb\" to \"#{db_role}\"")
    end

    def grant_aux_write_privileges_for_schema(s)
      db_run("grant usage on schema \"#{s}\" to \"#{db_role}\"")
      db_run("grant execute on all functions in schema \"#{s}\" to \"#{db_role}\"")
      db_run("grant usage, select on all sequences in schema \"#{s}\" TO \"#{db_role}\"")
      db_run("grant select on \"#{s}\".\"raster_columns\" TO \"#{db_role}\"")
      db_run("grant select on \"#{s}\".\"raster_overviews\" TO \"#{db_role}\"")
    end
  end
end
