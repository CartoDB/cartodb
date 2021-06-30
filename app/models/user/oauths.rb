# TODO: move to app/models/carto/user/
module CartoDB
  # This class encapsulates access to OAuct connections from the outside
  # to make sure the proper Carto::User methods are used
  class OAuths

    # Class constructor
    # @param owner_user ::User
    def initialize(owner_user)
      @owner = owner_user
      @owner = Carto::User.find(@owner.id) unless @owner.is_a?(Carto::User)
    end #initialize

    def all
      @owner.oauth_connections
    end #all

    # @param service string
    # @return SynchronizationOauth
    def select(service)
      @owner.oauth_for_service(service)
    end #select

    def add(service, token, parameters = nil)
      @owner.add_oauth(service, token, parameters)
      self
    end

    def remove(service)
      oauth = @owner.oauth_for_service(service)
      oauth.delete unless oauth.nil?
      @owner.reload
      self
    end

  end #OAuths
end #CartoDB