require 'active_support' # TODO: required cartodb-common JobLogger is not requiring active_support correctly
require 'cartodb-common'

# TODO: move these three doubles to cartodb-common, as they are also in Central
class TopicDouble < Carto::Common::MessageBroker::Topic

  # rubocop:disable Lint/MissingSuper
  def initialize; end
  # rubocop:enable Lint/MissingSuper

  def publish(_event, _payload)
    true
  end

  def create_subscription(_subscription_name)
    SubscriptionDouble.new
  end

  def delete; end

end

class SubscriptionDouble < Carto::Common::MessageBroker::Subscription

  # rubocop:disable Lint/MissingSuper
  def initialize; end
  # rubocop:enable Lint/MissingSuper

  def delete; end

end

class MessageBrokerDouble < Carto::Common::MessageBroker

  include Singleton

  # rubocop:disable Lint/MissingSuper
  def initialize
    @topics = {}
  end
  # rubocop:enable Lint/MissingSuper

  def get_topic(topic_name)
    @topics[topic_name] ||= TopicDouble.new
  end

  def create_topic(topic_name)
    @topics[topic_name] ||= TopicDouble.new
  end

  def get_subscription(_subscription_name)
    SubscriptionDouble.new
  end

end

shared_context 'with MessageBroker stubs' do
  before do
    double = MessageBrokerDouble.instance
    Carto::Common::MessageBroker.stubs(:new).returns(double)
  end
end
