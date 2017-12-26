
module CartoDB
  # This class encapsulates access to synchronization_oauths from the outside
  class OAuths

    # Class constructor
    # @param owner_user ::User
    def initialize(owner_user)
      @owner = owner_user
    end #initialize

    def all
      @owner.synchronization_oauths
    end #all

    # @param service string
    # @return SynchronizationOauth
    def select(service)
      SynchronizationOauth.where(service: service, user_id: @owner.id).first
    end #select

    def add(service, token)
      new_oauth = SynchronizationOauth.create(
          user_id:  @owner.id,
          service:  service,
          token:    token
      )
      @owner.add_synchronization_oauth(new_oauth)
      self
    end

    def remove(service)
      oauth = SynchronizationOauth.where(service: service, user_id: @owner.id).first
      oauth.delete unless oauth.nil?
      @owner.reload
      self
    end

  end #OAuths
end #CartoDB