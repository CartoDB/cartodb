
module CartoDB
  # This class encapsulates access to synchronization_oauths from the outside
  class OAuths

    # Class constructor
    # @param owner_user User
    def initialize(owner_user)
      @owner = owner_user
    end #initialize

    def all
      @owner.synchronization_oauths
    end #all

    def add(service, token)
      new_oauth = SynchronizationOauth.new

      new_oauth.user_id = @owner.id
      new_oauth.service = service
      new_oauth.token = token

      raise StandardError unless (new_oauth.valid? && new_oauth.save)

      debugger

      new_oauth
    end

    def remove(service)
      raise StandardError, "Pending implementation"
    end

  end #OAuths
end #CartoDB