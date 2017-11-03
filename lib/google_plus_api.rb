require_dependency 'google_plus_api_user_data'
require_dependency 'google_plus_config'
require_relative 'carto/http/client'
require_dependency 'carto/email_cleaner'

class GooglePlusAPI
  include Carto::EmailCleaner

  def get_user_data(access_token)
    response = request_user_data(access_token)
    if response.code == 200
      GooglePlusAPIUserData.new(::JSON.parse(response.body))
    else
      CartoDB::Logger.info(message: 'Failed getting user from google', error_info: response.to_s)
      nil
    end
  rescue => e
    CartoDB::Logger.error(exception: e)
    nil
  end

  # Returns user if access_token is valid and user is known, nil if it's valid but unknown, and false otherwise
  def get_user(access_token)
    google_user_data = GooglePlusAPI.new.get_user_data(access_token)
    # INFO: we assume if a user is queried at a CartoDB instance, user is local
    google_user_data.present? ? ::User.where(email: clean_email(google_user_data.email)).first : false
  end

  def request_user_data(access_token)
    http_client = Carto::Http::Client.get(self.class.name)
    http_client.request(
      "https://www.googleapis.com/plus/v1/people/me?access_token=#{access_token}",
      method: 'GET',
      ssl_verifypeer: true,
      timeout: 600
    ).run
  end

end
