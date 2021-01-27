class CartoCommand < Carto::Common::BaseCommand

  attr_accessor :notifications_topic

  def initialize(params = {}, extra_context = {})
    self.notifications_topic = extra_context[:notifications_topic]
    super
  end

end
