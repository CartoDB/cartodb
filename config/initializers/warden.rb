Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password
  manager.failure_app = SessionsController
end

# Setup Session Serialization
class Warden::SessionSerializer
  def serialize(record)
    record[:id]
  end

  def deserialize(keys)
    User.filter(:id => keys).select(:id,:email,:username).first
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