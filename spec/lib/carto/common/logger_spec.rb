require 'spec_helper'
require 'support/helpers'
require 'factories/users_helper'

describe(Carto::Common::Logger, type: :request) do
  include Warden::Test::Helpers
  include_context 'users helper'

  class LogDeviceMock < Logger::LogDevice

    attr_accessor :written_text

    def write(text)
      super(text)
      self.written_text = '' unless written_text
      self.written_text += text
    end

    def self.capture_output
      original_log_device = Rails.logger.instance_variable_get(:@logdev)
      mock_log_device = new('fake.log')
      Rails.logger.instance_variable_set(:@logdev, mock_log_device)
      yield
      Rails.logger.instance_variable_set(:@logdev, original_log_device)
      mock_log_device.written_text
    end

  end

  let!(:user) do
    @user1.builder_enabled = true
    @user1.save
    @user1
  end
  let(:map) { create(:map, user_id: user.id) }
  let(:visualization) { create(:carto_visualization, user_id: user.id, map_id: map.id) }
  let(:visualization_url) { builder_visualization_url(id: visualization.id) }
  let(:output) { LogDeviceMock.capture_output { get(visualization_url) } }

  before { ActionDispatch::Request.any_instance.stubs(:uuid).returns('1234') }

  it 'logs request arrival' do
    login(user)

    expect(output).to match(/"request_id":"1234".*"request_method":"GET".*"request_path":"\/builder\/#{visualization.id}".*"event_message":"Received request"/)
  end

  it 'obfuscates sensitive parameters' do
    output = LogDeviceMock.capture_output do
      get(
        root_path,
        password: 'password',
        nested: { token: 'token', auth_stuff: 'auth_stuff' },
        nested_array: %w[auth sensible_stuff]
      )
    end

    expect(output).to match(/password=(\*{8})/)
    expect(output).to match(/nested\[token\]=(\*{5})/)
    expect(output).to match(/nested\[auth_stuff\]=(\*{10})/)
    expect(output).to match(/nested_array=(\*{4})(.*)(\*{14})/)
  end

  it 'logs request processing' do
    login(user)

    expect(output).to match(%r{"request_id":"1234".*"controller":"Carto::Builder::VisualizationsController#show".*"cdb-user":"#{user.username}".*"event_message":"Processing request"})
  end

  it 'logs request completion' do
    login(user)

    expect(output).to match(/"request_id":"1234".*"status":200.*"cdb-user":"#{user.username}".*"event_message":"Request completed"/)
  end

  it 'logs request completion when failed' do
    login(user)
    Carto::Builder::VisualizationsController.any_instance.stubs(:show).raises(StandardError, 'Unexpected error')

    output = LogDeviceMock.capture_output do
      begin
        get(visualization_url)
      rescue StandardError
      end
    end

    expect(output).to match(/"request_id":"1234".*"status":500.*"cdb-user":"#{user.username}".*"event_message":"Request completed"/)
  end

  it 'logs when a controller hook halted execution' do
    output = LogDeviceMock.capture_output { get(visualization_url) }

    expect(output).to match(/"request_id":"1234".*"filter":":builder_users_only\".*"event_message":"Filter chain halted \(rendered or redirected\)"/)
  end

  it 'logs when an emails was sent' do
    output = LogDeviceMock.capture_output { user.carto_user.send_password_reset! }

    expect(output).to match(/"event_message":"Mail processed"/)
    expect(output).to match(/"event_message":"Mail sent"/)
  end
end
