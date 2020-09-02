module Carto::Sessions
  def invalidate_all_sessions!
    self.session_salt = SecureRandom.hex

    if update_in_central
      save(raise_on_failure: true)
    else
      CartoDB::Logger.error(message: "Cannot invalidate session")
    end
  rescue CartoDB::CentralCommunicationFailure, Sequel::ValidationFailed => e
    CartoDB::Logger.error(exception: e, message: "Cannot invalidate session")
  end
end
