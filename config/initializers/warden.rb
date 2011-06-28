Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_authentication
  manager.failure_app = SessionsController
end

# Setup Session Serialization
class Warden::SessionSerializer
  def serialize(user)
    user.id
  end

  def deserialize(user_id)
    User.filter(:id => user_id).select(:id,:email,:username,:tables_count,:crypted_password,:database_name,:admin).first
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
    if params[:api_key].blank? && request.headers['Authorization'].blank? && params[:oauth_token].blank?
      throw(:warden)
    else
      if params[:api_key]
        if api_key = APIKey[:api_key => params[:api_key]]
          success!(User[api_key.user_id])
          # TODO
          # if api_key.domain == request.host
          #   success!(api_key.user)
          # else
          #   fail!
          # end
        else
          throw(:warden)
        end
      else
        if request.headers['Authorization'].present?
          token = request.headers['Authorization'].split(',').select{ |p| p.include?('oauth_token') }.first.split('=').last.tr('\"','')
          if token and user_id = $api_credentials.hget("rails:oauth_tokens:#{token}", "user_id")
            success!(User.find_with_custom_fields(user_id))
          else
            if ClientApplication.verify_request(request) do |request_proxy|
                unless oauth_token = ClientApplication.find_token(request_proxy.token)
                  throw(:warden)
                else
                  success!(User.find_with_custom_fields(oauth_token.user_id))
                end
              end
            end
          end
        elsif params[:oauth_token].present?
          if user_id = $api_credentials.hget("rails:oauth_tokens:#{params[:oauth_token]}", "user_id")
            success!(User.find_with_custom_fields(user_id))
          else
            unless oauth_token = ClientApplication.find_token(params[:oauth_token])
              throw(:warden)
            else
              success!(User.find_with_custom_fields(oauth_token.user_id))
            end
          end
        end
      end
    end
  end
end
