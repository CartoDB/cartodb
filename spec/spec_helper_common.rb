def mocked_record(data)
  methods, attributes = data.partition { |k, v| v.kind_of?(Proc) }.map { |h| Hash[h] }
  record = Struct.new(*attributes.keys).new(*attributes.values)
  methods.each do |name, proc|
    record.define_singleton_method(name, proc)
  end
  record
end

def replace_connector_providers(*args)
  options = args.extract_options!
  original_providers = Carto::Connector::PROVIDERS.dup
  Carto::Connector::PROVIDERS.clear unless options[:incremental]
  Carto::Connector::PROVIDERS.push(*args)
  Carto::Connector.providers.keys.each do |provider_name|
    create(:connector_provider, name: provider_name) unless Carto::ConnectorProvider.where(name: provider_name).exists?
  end
  original_providers
end

def restore_connector_providers(providers)
  Carto::Connector::PROVIDERS.replace(providers)
end

def with_connector_providers(*args)
  original_providers = replace_connector_providers(*args)
  yield
ensure
  restore_connector_providers(original_providers)
end

def purgue_databases
  User.each do |user|
    begin
      # puts "Closing DB connections: #{user.database_name}"
      user.db_service.reset_pooled_connections
    rescue Sequel::DatabaseConnectionError, Sequel::DatabaseError
      nil
    end

    begin
      # puts "Removing DB: #{user.database_name}"
      user.db_service.drop_database_and_user
    rescue Sequel::DatabaseConnectionError, Sequel::DatabaseError
      nil
    end
  end

  Carto::FeatureFlagsUser.delete_all
  Carto::FeatureFlag.delete_all
  Carto::OauthToken.delete_all
  Carto::OauthAppUser.delete_all
  Carto::OauthApp.delete_all
  Carto::Map.delete_all
  Carto::ExternalDataImport.delete_all
  Carto::ExternalSource.delete_all
  Carto::Synchronization.delete_all
  Carto::Visualization.delete_all
  Carto::UserTable.delete_all
  Carto::User.delete_all
  Carto::SearchTweet.delete_all
  Carto::AccountType.delete_all
  Carto::RateLimit.delete_all
  Carto::ClientApplication.delete_all
  Carto::Asset.delete_all
  Carto::Organization.delete_all
end

##
# This is a really NASTY HACK for stubbing these methods in the specs.
# Regular stubs are being impossible to setup because we need the stub to be executed before any user creation.
# For that we need to make sure this runs before any before(:all) hook, which is really hard because of the general
# disorder regarding tests setup.
# Also, RSpec hooks don't seem to be evaluated in the order they should. I've seen a bugfix regarding this in the
# CHANGELOG, but bumping RSpec it's not trivial and not feasible right now.
# Sorry for the headaches this may give you in the future :(
Carto::ApiKey.class_eval do
  def create_remote_do_api_key; end

  def regenerate_remote_do_api_key; end

  def destroy_remote_do_api_key; end
end
