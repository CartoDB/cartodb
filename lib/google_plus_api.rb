require 'typhoeus'

class GooglePlusAPI

  def get_user_data(access_token)
    response = request_user_data(access_token)
    if response.code == 200
      GooglePlusAPIUserData.new(::JSON.parse(response.body))
    else
      Rollbar.report_message('Failed getting user from google', 'info', error_info: response.to_s)
      nil
    end
  rescue => e
    Rollbar.report_exception(e)
    nil
  end

  # Returns user if access_token is valid and user is known, nil if it's valid but unknown, and false otherwise
  def get_user(access_token)
    google_user_data = GooglePlusAPI.new.get_user_data(access_token)
    # INFO: we assume if a user is queried at a CartoDB instance, user is local
    google_user_data.present? ? User.where(email: google_user_data.email).first : false
  end

  def request_user_data(access_token)
    Typhoeus::Request.new(
      "https://www.googleapis.com/plus/v1/people/me?access_token=#{access_token}",
      method: 'GET',
      ssl_verifypeer: true,
      timeout: 600
    ).run
  end

end

class GooglePlusAPIUserData

  def initialize(parsed_response)
    @parsed_response = parsed_response
  end

  def email
    @parsed_response['emails'].select { |mail| mail['type'] == 'account' }.first['value']
  rescue
    nil
  end

  def id
    @parsed_response['id']
  end

end

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
