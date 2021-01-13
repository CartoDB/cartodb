class BaseCommand

  attr_accessor(
    :logger,
    :notifications_topic,
    :params,
    :request_id
  )

  def self.run(message = nil)
    new(message).run
  end

  def initialize(message = nil, extra_context = {})
    self.params = message.payload
    self.request_id = Carto::Common::CurrentRequest.request_id || message.request_id
    self.notifications_topic = extra_context[:notifications_topic]
    self.logger = extra_context[:logger] || Rails.logger
  end

  def run
    Carto::Common::CurrentRequest.with_request_id(request_id) do
      begin
        before_run_hooks
        run_command
      rescue StandardError => e
        logger.error(log_context.merge(message: 'Command failed', exception: e))
        raise e
      ensure
        after_run_hooks
      end
    end
  end

  private

  def run_command
    raise 'This method must be overriden'
  end

  def before_run_hooks
    logger.info(log_context.merge(message: 'Started command'))
  end

  def after_run_hooks
    logger.info(log_context.merge(message: 'Finished command'))
  end

  def log_context
    { command_class: self.class.name, request_id: request_id }
  end

end
