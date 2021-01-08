require 'spec_helper'
require './app/helpers/logger_helper'

class MockObject

  include LoggerHelper

end

describe LoggerHelper do
  before { allow_any_instance_of(User).to receive(:update_in_central).and_return(true) }

  let(:mock_object) { MockObject.new }
  let(:exception) { StandardError.new('Exception message') }

  describe 'log levels' do
    it 'logs a message with the appropiate level' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message')
      mock_object.log_info(message: 'Message')

      expect(Rails.logger).to receive(:error).with('message' => 'Message')
      mock_object.log_error(message: 'Message')
    end

    it 'parses the warning log level to Rails nomenclature' do
      expect(Rails.logger).to receive(:warn).with('message' => 'Message')

      mock_object.log_warning(message: 'Message')
    end
  end

  describe 'serialization' do
    let!(:user) { create(:user) }
    let(:carto_user) { Carto::User.find(user.id) }
    let(:organization) { create(:organization) }
    let(:carto_organization) { Carto::Organization.find(organization.id) }

    it 'accepts usernames as current_user' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message', 'current_user' => user.username)

      mock_object.log_info(message: 'Message', current_user: user.username)
    end

    it 'serializes User instances to usernames' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message', 'current_user' => user.username)

      mock_object.log_info(message: 'Message', current_user: user)
    end

    it 'serializes Carto::User instances to usernames' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message', 'current_user' => carto_user.username)

      mock_object.log_info(message: 'Message', current_user: carto_user)
    end

    it 'accepts organization names as organization' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message', 'organization' => organization.name)

      mock_object.log_info(message: 'Message', organization: organization.name)
    end

    it 'serializes Carto::Organization instances to names' do
      expect(Rails.logger).to receive(:info).with('message' => 'Message', 'organization' => carto_organization.name)

      mock_object.log_info(message: 'Message', organization: carto_organization)
    end
  end
end
