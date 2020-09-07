module Carto::SessionsInvalidations
  def invalidate_all_sessions!
    self.session_salt = SecureRandom.hex

    if update_in_central
      save!
    else
      log_error(message: "Could not invalidate session in Central")
    end
  rescue CartoDB::CentralCommunicationFailure, Sequel::ValidationFailed, ActiveRecord::RecordNotSaved => e
    log_error(exception: e, message: "Could not invalidate session")
  end
end
