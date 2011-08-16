Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_authentication
  manager.failure_app = SessionsController
end

# Setup Session Serialization
class Warden::SessionSerializer
  def serialize(user)
    user.username
  end

  def deserialize(username)
    User.filter(:username => username).select(:id,:email,:username,:tables_count,:crypted_password,:database_name,:admin, :map_enabled).first
  end
end

Warden::Strategies.add(:password) do
  def authenticate!
    if params[:email] && params[:password]
      if (user = User.authenticate(params[:email], params[:password])) && user.enabled?
        success!(user)
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:api_authentication) do
  def authenticate!
    if request.headers['Authorization'].present?
      if ClientApplication.verify_request(request) do |request_proxy|
          unless oauth_token = ClientApplication.find_token(request_proxy.token)
            throw(:warden)
          else
            success!(User.find_with_custom_fields(oauth_token.user_id))
          end
        end
      end
    else
      throw(:warden)
    end
  end
end
