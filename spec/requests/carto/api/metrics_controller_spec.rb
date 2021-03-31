require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::MetricsController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = create(:carto_user)
    @intruder = create(:carto_user)

    login(@user)
  end

  after(:all) do
    logout(@user)

    @user.destroy
    @instruder&.destroy
  end

  it 'should accept all existing events' do
    user_id = @user.id
    user_properties = { user_id: user_id, api_key: @user.api_key }

    Carto::Tracking::Events::Event.descendants.each do |event_class|
      next unless event_class.public_methods.include?(:new)

      event = event_class.new(user_id, user_id: user_id)

      event_class.any_instance.stubs(:report!)

      post_json metrics_url, name: event.name, properties: user_properties do |response|
        response.status.should eq 201
      end
    end
  end

  it 'should reject non existing events' do
    event_name = 'Everything was a lie'

    post_json metrics_url, name: event_name do |response|
      response.status.should eq 404
      response.body[:errors].should eq "Event not found: #{event_name}"
    end
  end

  describe 'validations' do
    it 'should require properties' do
      Carto::Tracking::Events::Event.descendants.each do |event_class|
        next unless event_class.public_methods.include?(:new)

        event = event_class.new(@user.id, {})

        unless event.required_properties.empty?
          post_json metrics_url, name: event.name, properties: {} do |response|
            response.status.should eq 422
            response.body[:errors].should eq "#{event.name} is missing the following properties: #{event.required_properties.join(', ')}"
          end
        end
      end
    end
  end
end
