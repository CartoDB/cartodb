class GoogleSignInConfig
  attr_reader :domain, :iframe_src, :client_id, :cookie_policy, :access_token_field_id
  attr_accessor :unauthenticated_valid_access_token

  # @param app_module CartoDB Module containing global functions
  # @param config CartoDB config
  # @param access_token_field_id String
  # @param button_color: hex for the color
  def self.instance(app_module, config, access_token_field_id = 'google_access_token', button_color = nil)
    return nil unless config[:oauth].present? && config[:oauth]['google_plus'].present?
    GoogleSignInConfig.new(app_module, config, access_token_field_id, button_color)
  end

  def initialize(app_module, config, access_token_field_id = 'google_access_token', button_color = nil)
    schema = Rails.env.development? ? 'http' : 'https'

    @domain = config[:domain_name].presence || app_module.account_host.scan(/([^:]*)(:.*)?/).first.first

    button_color_param = button_color.nil? ? '' : "?button_color=#{button_color}".delete('#')

    iframe_src_base_url = app_module.account_host.present? ? "#{schema}://#{app_module.account_host}" : @domain
    @iframe_src = "#{iframe_src_base_url}/google_plus#{button_color_param}"

    @access_token_field_id = access_token_field_id

    @client_id = config[:oauth]['google_plus']['client_id']

    @cookie_policy = config[:oauth]['google_plus']['cookie_policy']
  end

end
