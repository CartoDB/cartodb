module Cartodb
  
  class EventTracker

    def send_event(user, event_name, custom_properties = {})
      return unless is_tracking_active?      

      # Some events register custom properties
      # Monitary values associated with the event should use 'revenue' reserved key	
      properties = generate_event_properties(user).merge(custom_properties)

      Resque.enqueue(Resque::EventDeliveryJobs::TrackEvent, user.id, event_name, properties)
    end

    private
    def generate_event_properties(user)
      {
        'username' =>  user.username,
        'email' => user.email,
        'plan' => user.account_type,
        'organization' => user.organization_user? ? user.organization.name: nil,
        'event_origin' => 'Editor'
      }
    end

    def is_tracking_active?
      !Cartodb.config[:segment].blank? and !Cartodb.config[:segment]['api_key'].blank?
    end

  end
end
