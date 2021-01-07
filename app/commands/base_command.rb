class BaseCommand

  attr_accessor :params

  def self.run(params = {})
    new(params).run
  end

  def initialize(params = {})
    self.params = params.with_indifferent_access
  end

  def run
    before_run_hooks
    run_command
  rescue StandardError => e
    Rails.logger.error(log_context.merge(message: 'Command failed', exception: e))
    raise e
  ensure
    after_run_hooks
  end

  private

  def run_command
    raise 'This method must be overriden'
  end

  def before_run_hooks
    if Rails.env.production?
      Rails.logger.info(log_context.merge(message: 'Started command'))
    else
      Rails.logger.info(log_context.merge(message: 'Started command', params: params))
    end
  end

  def after_run_hooks
    Rails.logger.info(log_context.merge(message: 'Finished command'))
  end

  def log_context
    { command_class: self.class.name }
  end

  # TODO: parameterize so notifications_topic is passed as argument from the subscriber rake
  def message_broker
    @message_broker ||= begin
      $stdout.sync = true
      logger = Carto::Common::Logger.new($stdout)
      Carto::Common::MessageBroker.new(logger: logger)
    end
  end

  # TODO: parameterize so notifications_topic is passed as argument from the subscriber rake
  def notifications_topic
    @notifications_topic ||= message_broker.get_topic(:cartodb_central)
  end

end
