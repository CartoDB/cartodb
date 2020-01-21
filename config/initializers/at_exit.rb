
at_exit do
  begin
    CartoDB::Logger.info(message: 'Flushing Pub/Sub messages...')
    ::PubSubTracker.instance.graceful_shutdown unless Rails.env.test?
    CartoDB::Logger.info(message: 'Done Flushing Pub/Sub messages!')
  rescue StandardError => e
    CartoDB::Logger.error(message: "There was an #{e.to_s} while flushing Pub/sub messages.")
  end
end

