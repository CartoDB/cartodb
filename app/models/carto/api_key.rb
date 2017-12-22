require 'securerandom'

class Carto::ApiKey < ActiveRecord::Base

  include Carto::AuthTokenGenerator

  TYPE_REGULAR = 'regular'.freeze
  TYPE_MASTER = 'master'.freeze
  TYPE_DEFAULT_PUBLIC = 'default_public'.freeze

  VALID_TYPES = [TYPE_REGULAR, TYPE_MASTER, TYPE_DEFAULT_PUBLIC].freeze

  self.inheritance_column = :_type

  belongs_to :user

  before_create :create_token
  before_create :create_db_config

  before_validation :serialize_grants
  serialize :grants, Carto::CartoJsonSymbolizerSerializer
  validates :grants, carto_json_symbolizer: true

  serialize :affected_schemas, Carto::CartoJsonSymbolizerSerializer
  validates :affected_schemas, carto_json_symbolizer: true

  validates :name, presence: true

  after_save :add_to_redis
  after_save :update_role_permissions

  validates :type, inclusion: { in: VALID_TYPES }

  attr_writer :redis_client

  def api_key_grants
    @api_key_grants ||= ::Carto::ApiKeyGrants.new(grants)
  end

  private

  PASSWORD_LENGTH = 40

  REDIS_KEY_PREFIX = 'api_keys:'.freeze

  def create_token
    begin
      self.token = generate_auth_token
    end while self.class.exists?(token: token)
  end

  def create_db_config
    begin
      self.db_role = Carto::DB::Sanitize.sanitize_identifier("#{user.username}_role_#{SecureRandom.hex}")
    end while self.class.exists?(db_role: db_role)
    self.db_password = SecureRandom.hex(PASSWORD_LENGTH / 2) unless db_password
    connection.run(
      "create role \"#{db_role}\" NOSUPERUSER NOCREATEDB NOINHERIT LOGIN ENCRYPTED PASSWORD '#{db_password}'"
    )
  end

  def update_role_permissions
    revoke_privileges

    read_schemas = []
    write_schemas = []
    api_key_grants.table_permissions.each do |tp|
      read_schemas << tp.schema unless read_schemas.include?(tp.schema)
      write_schemas << tp.schema unless write_schemas.include?(tp.schema) || !tp.write?
      connection.run(
        "grant #{tp.permissions.join(', ')} on table \"#{tp.schema}\".\"#{tp.name}\" to \"#{db_role}\""
      )
    end

    write_schemas.each { |s| grant_aux_write_privileges_for_schema(s) }

    if !write_schemas.empty?
      write_schemas << 'cartodb'
      grant_usage_for_cartodb
    end

    update_column(:affected_schemas, (write_schemas + read_schemas).uniq.to_json)
  end

  def serialize_grants
    self.grants = api_key_grants.to_json
  end

  def add_to_redis
    redis_key = "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
    redis_client.hmset(redis_key, redis_hash_as_array)
  end

  def connection
    @connection ||= ::User[user.id].in_database(as: :superuser)
  end

  def redis_hash_as_array
    hash = ['user', user.username, 'type', type, 'dbRole', db_role, 'dbPassword', db_password]
    api_key_grants.granted_apis.each { |api| hash += ["grants_#{api}", true] }
    hash
  end

  def redis_client
    @redis_client ||= $users_metadata
  end

  def revoke_privileges
    affected_schemas ||= []
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
