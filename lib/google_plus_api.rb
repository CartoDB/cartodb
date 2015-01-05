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

  def get_user(access_token)
    google_user_data = GooglePlusAPI.new.get_user_data(access_token)
    google_user_data.present? ? User.where(email: google_user_data.email).first : nil
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
