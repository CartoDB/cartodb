# encoding: utf-8

require 'mocha'
require 'statsd'
require_relative '../../lib/cartodb_stats'

include Mocha::ParameterMatchers

describe CartodbStats do
  TEST_HOST = '172.28.128.3'
  TEST_PORT = 8125

  Statsd.host = TEST_HOST
  Statsd.port = TEST_PORT

  RSpec.configure do |config|
    config.mock_with :mocha
  end

  describe '#timing' do
    it "sends key" do
      timing_key = 'test.timing'
      expected_send(timing_key)
      CartodbStats.new.timing(timing_key) do
        sleep 0.001
      end
    end
  end

  def expected_send(buf)
    buf_re = Regexp.new(buf)
    UDPSocket.any_instance.expects(:send).with(regexp_matches(buf_re), 0, TEST_HOST, TEST_PORT).once
  end

end