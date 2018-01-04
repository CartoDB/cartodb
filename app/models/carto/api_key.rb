require 'securerandom'

class ApiKeyGrantsValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return record.errors[attribute] = ['grants has to be an array'] unless value && value.is_a?(Array)
    record.errors[attribute] << 'apis type has to be present' unless value.any? { |v| v[:type] == 'apis' }
    record.errors[attribute] << 'only one apis section is allowed' if value.count { |v| v[:type] == 'apis' } > 1
    record.errors[attribute] << 'only one database section is allowed' if value.count { |v| v[:type] == 'database' } > 1
  end
end

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

  serialize :grants, Carto::CartoJsonSymbolizerSerializer
  validates :grants, carto_json_symbolizer: true, api_key_grants: true, json_schema: true

  validates :name, presence: true

  after_create :setup_db_role
  after_save :add_to_redis
  after_save :update_role_permissions

  after_destroy :drop_db_role
  after_destroy :remove_from_redis

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
  end

  def setup_db_role
    user_db_connection.run(
      "create role \"#{db_role}\" NOSUPERUSER NOCREATEDB NOINHERIT LOGIN ENCRYPTED PASSWORD '#{db_password}'"
    )
  end

  def drop_db_role
    revoke_privileges(*affected_schemas(api_key_grants))
    user_db_connection.run("drop role \"#{db_role}\"")
  end

  def update_role_permissions
    revoke_privileges(*affected_schemas(Carto::ApiKeyGrants.new(grants_was))) if grants_was.present?
    _, write_schemas = affected_schemas(api_key_grants)

    api_key_grants.table_permissions.each do |tp|
      unless tp.permissions.empty?
        user_db_connection.run(
          "grant #{tp.permissions.join(', ')} on table \"#{tp.schema}\".\"#{tp.name}\" to \"#{db_role}\""
        )
      end
    end

    write_schemas.each { |s| grant_aux_write_privileges_for_schema(s) }

    if !write_schemas.empty?
      grant_usage_for_cartodb
    end
  end

  def affected_schemas(api_key_grants)
    read_schemas = []
    write_schemas = []
    api_key_grants.table_permissions.each do |tp|
      read_schemas << tp.schema
      write_schemas << tp.schema unless !tp.write?
    end
    [read_schemas.uniq, write_schemas.uniq]
  end

  def serialize_grants
    self.grants = api_key_grants.to_json
  end

  def redis_key
    "#{REDIS_KEY_PREFIX}#{user.username}:#{token}"
  end

  def add_to_redis
    redis_client.hmset(redis_key, redis_hash_as_array)
  end

  def remove_from_redis
    redis_client.del(redis_key)
  end

  def user_db_connection
    @user_db_connection ||= ::User[user.id].in_database(as: :superuser)
  end

  def redis_hash_as_array
    hash = ['user', user.username, 'type', type, 'dbRole', db_role, 'dbPassword', db_password]
    api_key_grants.granted_apis.each { |api| hash += ["grants_#{api}", true] }
    hash
  end

  def redis_client
    @redis_client ||= $users_metadata
  end

  def revoke_privileges(read_schemas, write_schemas)
    schemas = read_schemas + write_schemas
    schemas << 'cartodb' if write_schemas.present?
    schemas.uniq.each do |schema|
      user_db_connection.run(
        "revoke all privileges on all tables in schema \"#{schema}\" from \"#{db_role}\""
      )
      user_db_connection.run(
        "revoke usage on schema \"#{schema}\" from \"#{db_role}\""
      )
      user_db_connection.run(
        "revoke execute on all functions in schema \"#{schema}\" from \"#{db_role}\""
      )
      user_db_connection.run(
        "revoke usage, select on all sequences in schema \"#{schema}\" from \"#{db_role}\""
      )
    end
    user_db_connection.run("revoke usage on schema \"cartodb\" from \"#{db_role}\"")
    user_db_connection.run("revoke execute on all functions in schema \"cartodb\" from \"#{db_role}\"")
  end

  def grant_usage_for_cartodb
    user_db_connection.run("grant usage on schema \"cartodb\" to \"#{db_role}\"")
    user_db_connection.run("grant execute on all functions in schema \"cartodb\" to \"#{db_role}\"")
  end

  def grant_aux_write_privileges_for_schema(s)
    user_db_connection.run("grant usage on schema \"#{s}\" to \"#{db_role}\"")
    user_db_connection.run("grant execute on all functions in schema \"#{s}\" to \"#{db_role}\"")
    user_db_connection.run("grant usage, select on all sequences in schema \"#{s}\" TO \"#{db_role}\"")
    user_db_connection.run("grant select on \"#{s}\".\"raster_columns\" TO \"#{db_role}\"")
    user_db_connection.run("grant select on \"#{s}\".\"raster_overviews\" TO \"#{db_role}\"")
  end
end
