# encoding utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::MetricsController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)
    login(@user)
  end

  after(:all) do
    @user.destroy
    @instruder.destroy
  end

  it 'should accept all existing events' do
    Carto::Tracking::Events::Event.descendants.each do |event_class|
      event = event_class.new(@user.id)

      event_class.any_instance.stubs(:report!)

      post_json metrics_url, name: event.name, properties: {} do |response|
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
        event = event_class.new(@user.id, {})

        puts "Testing #{event_class}"

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
