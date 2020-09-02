module Carto::Sessions
  def invalidate_all_sessions!
    self.session_salt = SecureRandom.hex

    if update_in_central
      # NOTE: this is a hack for making the code AR/Sequel compatible
      save(raise_on_failure: true) || raise(ActiveRecord::RecordNotSaved.new("Failed to save the record", self))
    else
      log_error(message: "Could not invalidate session in Central")
    end
  rescue CartoDB::CentralCommunicationFailure, Sequel::ValidationFailed, ActiveRecord::RecordNotSaved => e
    log_error(exception: e, message: "Could not invalidate session")
  end
end
