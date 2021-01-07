class BaseCommand

  attr_accessor(
    :notifications_topic,
    :params,
    :request_id
  )

  def self.run(params = {})
    new(params).run
  end

  def initialize(params = {}, extra_context = {})
    self.params = params.with_indifferent_access
    self.request_id = Carto::Common::CurrentRequest.request_id || params.delete(:request_id)
    self.notifications_topic = extra_context[:notifications_topic]
  end

  def run
    Carto::Common::CurrentRequest.with_request_id(request_id) do
      begin
        before_run_hooks
        run_command
      rescue StandardError => e
        Rails.logger.error(log_context.merge(message: 'Command failed', exception: e))
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
    Rails.logger.info(log_context.merge(message: 'Started command', params: loggable_params))
  end

  def after_run_hooks
    Rails.logger.info(log_context.merge(message: 'Finished command'))
  end

  def log_context
    { command_class: self.class.name, request_id: request_id }
  end

end
