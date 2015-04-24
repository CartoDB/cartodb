require 'active_record'

class Carto::User < ActiveRecord::Base
  has_many :visualizations, inverse_of: :user
  belongs_to :organization, inverse_of: :users

  has_many :feature_flags_user, dependent: :destroy
  has_many :feature_flags, :through => :feature_flags_user

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url, users.api_key, users.dynamic_cdn_enabled, users.database_schema, users.database_name, users.name, users.disqus_shortname, users.account_type, users.twitter_username"

  # @return String public user url, which is also the base url for a given user
  def public_url(subdomain_override=nil, protocol_override=nil)
    CartoDB.base_url(subdomain_override.nil? ? subdomain : subdomain_override, organization_username, protocol_override)
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end

  def feature_flags_list
    @feature_flag_names ||= (self.feature_flags_user
                                 .map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false)
                                                                                 .map { |ff| ff.name }).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    self.feature_flags_list.present? && self.feature_flags_list.include?(feature_flag_name)
  end

  def has_organization?
    !organization_id.nil?
  end

  def avatar
    self.avatar_url.nil? ? "//#{self.default_avatar}" : self.avatar_url
  end

  def remove_logo?
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def organization_username
    CartoDB.subdomainless_urls? || organization.nil? ? nil : username
  end

  def sql_safe_database_schema
    "\"#{self.database_schema}\""
  end

  def database_username
    if Rails.env.production?
      "cartodb_user_#{id}"
    elsif Rails.env.staging?
      "cartodb_staging_user_#{self.id}"
    else
      "#{Rails.env}_cartodb_user_#{id}"
    end
  end

  def database_password
    self.crypted_password + database_username
  end

  # TODO: Migrate remaining
  def in_database(options = {})
    get_database(options)
  end

  private

  def default_avatar
    return "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  def database_public_username
    (self.database_schema != CartoDB::DEFAULT_DB_SCHEMA) ? "cartodb_publicuser_#{id}" : CartoDB::PUBLIC_DB_USER
  end

  def get_database(options)
      #TODO: Sequel one also sets search_path after connecting      
      ActiveRecord::Base.establish_connection(get_db_configuration_for(options[:as])).connection
  end

  def get_db_configuration_for(user = nil)
    logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)

    base_config = ::Rails::Sequel.configuration.environment_for(Rails.env)

    config = {
      adapter:  "postgresql",
      logger:   logger,
      host:     self.database_host,
      username: base_config['username'],
      password: base_config['password'],
      database: self.database_name
    }

    if user == :superuser
      # Nothing needed
      config
    elsif user == :cluster_admin
      config.merge({
          database: 'postgres'
        })
    elsif user == :public_user
      config.merge({
          username: CartoDB::PUBLIC_DB_USER,
          password: CartoDB::PUBLIC_DB_USER_PASSWORD
        })
    elsif user == :public_db_user
      config.merge({
          username: database_public_username,
          password: CartoDB::PUBLIC_DB_USER_PASSWORD
        })
    else
      config.merge({
          username: database_username,
          password: database_password,
        })
    end

  end

end
