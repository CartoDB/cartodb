class GooglePlusConfig
  attr_reader :domain, :signup_action, :iframe_src, :client_id, :cookie_policy, :access_token_field_id
  attr_accessor :unauthenticated_valid_access_token

  def self.instance(config, signup_action, access_token_field_id = 'google_access_token')
    config[:oauth]['google_plus'].present? ? GooglePlusConfig.new(config, signup_action, access_token_field_id) : nil
  end

  def initialize(config, signup_action, access_token_field_id = 'google_access_token')
    schema = Rails.env.development? ? 'http' : 'https'

    @domain = config[:domain_name].present? ? config[:domain_name] : config[:account_host].scan(/([^:]*)(:.*)?/).first.first

    @signup_action = signup_action

    @iframe_src = config[:account_host].present? ? "#{schema}://#{config[:account_host]}/google_plus" : "#{@domain}/google_plus"

    @access_token_field_id = access_token_field_id

    @client_id = config[:oauth]['google_plus']['client_id']

    @cookie_policy = config[:oauth]['google_plus']['cookie_policy']
  end

end

