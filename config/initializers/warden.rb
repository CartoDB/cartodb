Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_key, :oauth_token
  manager.failure_app = SessionsController
end

# Setup Session Serialization
class Warden::SessionSerializer
  def serialize(record)
    record[:id]
  end

  def deserialize(keys)
    User.filter(:id => keys).select(:id,:email,:username,:tables_count,:crypted_password,:database_name).first
  end
end

Warden::Strategies.add(:password) do
  def authenticate!
    if params[:email] && params[:password]
      if user = User.authenticate(params[:email], params[:password])
        success!(user)
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:api_key) do
  def authenticate!
    if params[:api_key]
      if api_key = APIKey[:api_key => params[:api_key]]
        success!(api_key.user)
        # TODO
        # if api_key.domain == request.host
        #   success!(api_key.user)
        # else
        #   fail!
        # end
      else
        fail!
      end
    else
      fail!
    end
  end

  def fail!
    render :status => 401, :nothing => true
  end
end

Warden::Strategies.add(:oauth_token) do
  def authenticate!
    if request.headers['Authorization'].blank?
      fail!
    else
      if ClientApplication.verify_request(request) do |request_proxy|
          @oauth_token = ClientApplication.find_token(request_proxy.token)
          if @oauth_token.respond_to?(:provided_oauth_verifier=)
            @oauth_token.provided_oauth_verifier = request_proxy.oauth_verifier
          end
        end
      end
      user = User[@oauth_token.user_id]
      success!(user)
    end
  end

  def fail!
    render :status => 401, :nothing => true
  end
end