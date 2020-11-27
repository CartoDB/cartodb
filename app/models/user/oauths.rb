# TODO: move to app/models/carto/user/
module CartoDB
  # This class encapsulates access to OAuct connections from the outside
  # to make sure the proper Carto::User methods are used
  class OAuths

    # Class constructor
    # @param owner_user ::User
    def initialize(owner_user)
      @oner = owner_user
      @owner = Carto::User.find(@owner.id) unless @owner.kind_of?(Carto::User)
    end #initialize

    def all
      @owner.oauth_connections
    end #all

    # @param service string
    # @return SynchronizationOauth
    def select(service)
      @owner.oauth_for_service(service)
    end #select

    def add(service, token)
      @owner.add_oauth(service, token)
      self
    end

    def remove(service)
      # oauth = Carto::Conection.where(connection_type: Connection::TYPE_OAUTH_SERVICE, service: service, user_id: @owner.id).first
      oauth = @owner.oauth_for_service(service)
      oauth.delete unless oauth.nil?
      @owner.reload
      self
    end

  end #OAuths
end #CartoDB