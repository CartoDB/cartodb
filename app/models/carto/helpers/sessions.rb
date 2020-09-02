module Carto::Sessions
  def invalidate_all_sessions!
    self.session_salt = SecureRandom.hex

    if update_in_central
      # NOTE: this is a hack for making the code AR/Sequel compatible
      save(raise_on_failure: true) || raise(ActiveRecord::RecordNotSaved.new("Failed to save the record", self))
    else
      CartoDB::Logger.error(message: "Cannot invalidate session")
    end
  rescue CartoDB::CentralCommunicationFailure, Sequel::ValidationFailed, ActiveRecord::RecordNotSaved => e
    CartoDB::Logger.error(exception: e, message: "Cannot invalidate session")
  end
end
