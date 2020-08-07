require 'spec_helper'
require './app/helpers/logger_helper'

describe LoggerHelper do

  class MockObject; include LoggerHelper end

  before { User.any_instance.stubs(:update_in_central).returns(true) }

  let(:mock_object) { MockObject.new }
  let(:exception) { StandardError.new('Exception message') }

  describe 'log levels' do
    it 'logs a message with the appropiate level' do
      Rails.logger.expects(:info).with('message' => 'Message')
      mock_object.log_info(message: 'Message')

      Rails.logger.expects(:error).with('message' => 'Message')
      mock_object.log_error(message: 'Message')
    end

    it 'parses the warning log level to Rails nomenclature' do
      Rails.logger.expects(:warn).with('message' => 'Message')

      mock_object.log_warning(message: 'Message')
    end

    it 'reports plain error message to Rollbar' do
      Rollbar.expects(:error).with('Custom error message')

      mock_object.log_error(message: 'Custom error message')
    end

    it 'reports exceptions to Rollbar' do
      Rollbar.expects(:error).with(exception)

      mock_object.log_error(exception: exception)
    end

    it 'reports exceptions with custom message to Rollbar' do
      Rollbar.expects(:error).with(exception, 'Message')

      mock_object.log_error(message: 'Message', exception: exception)
    end
  end

  describe 'serialization' do
    let!(:user) { create(:user) }
    let(:carto_user) { Carto::User.find(user.id) }
    let(:organization) { create(:organization) }
    let(:carto_organization) { Carto::Organization.find(organization.id) }

    it 'accepts usernames as current_user' do
      Rails.logger.expects(:info).with('message' => 'Message', 'current_user' => user.username)

      mock_object.log_info(message: 'Message', current_user: user.username)
    end

    it 'serializes User instances to usernames' do
      Rails.logger.expects(:info).with('message' => 'Message', 'current_user' => user.username)

      mock_object.log_info(message: 'Message', current_user: user)
    end

    it 'serializes Carto::User instances to usernames' do
      Rails.logger.expects(:info).with('message' => 'Message', 'current_user' => carto_user.username)

      mock_object.log_info(message: 'Message', current_user: carto_user)
    end

    it 'accepts organization names as organization' do
      Rails.logger.expects(:info).with('message' => 'Message', 'organization' => organization.name)

      mock_object.log_info(message: 'Message', organization: organization.name)
    end

    it 'serializes Carto::Organization instances to names' do
      Rails.logger.expects(:info).with('message' => 'Message', 'organization' => carto_organization.name)

      mock_object.log_info(message: 'Message', organization: carto_organization)
    end

    it 'serializes Exception objects' do
      Rails.logger.expects(:error).with(
        'message' => 'Message',
        'exception' => { 'class' => 'StandardError', 'message' => 'Exception message', 'backtrace_hint' => nil }
      )

      mock_object.log_error(message: 'Message', exception: exception)
    end
  end

end
