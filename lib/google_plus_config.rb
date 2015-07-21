class GooglePlusConfig
  attr_reader :domain, :signup_action, :iframe_src, :client_id, :cookie_policy, :access_token_field_id
  attr_accessor :unauthenticated_valid_access_token

  # @param app_module CartoDB Module containing global functions
  # @param config CartoDB config
  # @param signup_action Signup action, usually without subdomain. Google login button requires request to come from a known subdomain, so we can't use subdomain schema.
  # @param access_token_field_id String
  # @param button_color: hex for the color
  def self.instance(app_module, config, signup_action, access_token_field_id = 'google_access_token', button_color = nil)
    config[:oauth].present? && config[:oauth]['google_plus'].present? ?
      GooglePlusConfig.new(app_module, config, signup_action, access_token_field_id, button_color) : nil
  end

  def initialize(app_module, config, signup_action, access_token_field_id = 'google_access_token', button_color = nil)
    schema = Rails.env.development? ? 'http' : 'https'

    @domain = config[:domain_name].present? ? config[:domain_name] : app_module.account_host.scan(/([^:]*)(:.*)?/).first.first

    @signup_action = signup_action

    button_color_param = button_color.nil? ? '' : "?button_color=#{button_color}".gsub('#', '')

    @iframe_src = app_module.account_host.present? ? "#{schema}://#{app_module.account_host}/google_plus#{button_color_param}" : "#{@domain}/google_plus#{button_color_param}"

    @access_token_field_id = access_token_field_id

    @client_id = config[:oauth]['google_plus']['client_id']

    @cookie_policy = config[:oauth]['google_plus']['cookie_policy']
  end

end

