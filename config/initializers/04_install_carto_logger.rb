Carto::Common::Logger.install

# Log more easily from all models
ActiveRecord::Base.class_eval do
  include ::LoggerHelper
  extend ::LoggerHelper
end

Sequel::Model.class_eval do
  include ::LoggerHelper
  extend ::LoggerHelper
end

Carto::Common::MessageBroker::Subscription.class_eval do
  def start(options = {})
    logger.info(message: 'Starting message processing in subscriber',
                subscription_name: @subscription_name)
    @subscriber = @subscription.listen(options.merge(threads: { callback: 1, push: 1 }), &method(:main_callback))
    @subscriber.start
  end
end
