require 'securerandom'

class Carto::ApiKey < ActiveRecord::Base

  TOKEN_LENGTH = 40
  ROLE_LENGTH = 10
  PASSWORD_LENGTH = 40

  TYPE_REGULAR = 'regular'.freeze
  TYPE_MASTER = 'master'.freeze
  TYPE_DEFAULT_PUBLIC = 'default_public'.freeze

  VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC].freeze

  REDIS_KEY_PREFIX = 'api_keys:'.freeze

  belongs_to :user

  before_create :create_token
  before_create :create_db_config

  before_save :update_modification_times
  before_save :serialize_grants

  after_save :add_to_redis
  after_save :update_role_permissions

  validates :api_type, inclusion: { in: VALID_TYPES }

  alias_attribute :type, :api_type
  alias_attribute :type=, :api_type=

  attr_writer :redis_client

  def create_token
    self.token = SecureRandom.hex(TOKEN_LENGTH / 2) unless token
  end

  def create_db_config
    self.db_role = "#{user.username}_role_#{SecureRandom.hex(ROLE_LENGTH / 2)}" unless db_role
    self.db_password = SecureRandom.hex(PASSWORD_LENGTH / 2) unless db_password
    create_db_role
  end

  def create_db_role
    connection.run(
      "create role \"#{db_role}\" NOSUPERUSER NOCREATEDB NOINHERIT LOGIN ENCRYPTED PASSWORD '#{db_password}'"
    )
  end

  def update_role_permissions
    user = ::User[self.user.id]
    revoke_privileges(user)

    read_schemas = []
    write_schemas = []
    table_permissions.each do |tp|
      read_schemas << tp.schema unless read_schemas.include?(tp.schema)
      write_schemas << tp.schema unless write_schemas.include?(tp.schema) || !tp.write?
      connection.run(
        "grant #{tp.permissions.join(', ')} on table \"#{tp.schema}\".\"#{tp.name}\" to \"#{db_role}\""
      )
    end

    write_schemas.each { |s| grant_aux_write_privileges_for_schema(s) }

    if write_schemas.size > 0
      write_schemas << 'cartodb'
      grant_usage_for_cartodb
    end

    update_column(:affected_schemas_json, (write_schemas + read_schemas).uniq.to_json)
  end

  def update_modification_times
    now = Time.now
    self.created_at = now unless created_at
    self.updated_at = now
  end

  def serialize_grants
    self.grants_json = grants_hash.to_json
  end

  def add_to_redis
    redis_client.hmset(redis_key, redis_hash_as_array)
  end

  def granted_apis
    grants.granted_apis
  end

  def table_permissions
    grants.table_permissions
  end

  def grants_hash
    grants.to_hash
  end

  private

  def connection
    @connection ||= ::User[self.user.id].in_database(as: :superuser)
  end

  def redis_key
    "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
  end

  def redis_hash_as_array
    hash = ['user', user.username, 'type', type, 'dbRole', db_role, 'dbPassword', db_password]
    grants.granted_apis.each { |api| hash += ["grants_#{api}", true]}
    hash
  end

  def redis_client
    @redis_client ||= $users_metadata
  end

  def grants
    @grants ||= ::Carto::ApiKeyGrants.new(grants_json)
  end

  def affected_schemas
    JSON.parse(affected_schemas_json || '[]')
  end

  def revoke_privileges(user)
    affected_schemas.each do |schema|
      connection.run(
        "revoke all privileges on all tables in schema \"#{schema}\" from \"#{db_role}\""
      )
      connection.run(
        "revoke usage on schema \"#{schema}\" from \"#{db_role}\""
      )
      connection.run(
        "revoke execute on all functions in schema \"#{schema}\" from \"#{db_role}\""
      )
      connection.run(
        "revoke usage, select on all sequences in schema \"#{schema}\" from \"#{db_role}\""
      )
    end
    connection.run("revoke usage on schema \"cartodb\" from \"#{db_role}\"")
    connection.run("revoke execute on all functions in schema \"cartodb\" from \"#{db_role}\"")
  end

  def grant_usage_for_cartodb
    connection.run("grant usage on schema \"cartodb\" to \"#{db_role}\"")
    connection.run("grant execute on all functions in schema \"cartodb\" to \"#{db_role}\"")
  end

  def grant_aux_write_privileges_for_schema(s)
    connection.run("grant usage on schema \"#{s}\" to \"#{db_role}\"")
    connection.run("grant execute on all functions in schema \"#{s}\" to \"#{db_role}\"")
    connection.run("grant usage, select on all sequences in schema \"#{s}\" TO \"#{db_role}\"")
    connection.run("grant select on \"#{s}\".\"raster_columns\" TO \"#{db_role}\"")
    connection.run("grant select on \"#{s}\".\"raster_overviews\" TO \"#{db_role}\"")
  end
end
