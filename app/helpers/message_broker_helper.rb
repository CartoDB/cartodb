module MessageBrokerHelper

  def message_broker
    Carto::Common::MessageBroker.new(logger: Rails.logger)
  end

  def cartodb_central_topic
    Carto::Common::MessageBroker.new(logger: Rails.logger).get_topic(:cartodb_central)
  end

end
