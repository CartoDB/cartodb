# encoding: utf-8

require 'mocha'
require_relative '../../lib/importer/importer_stats'

include Mocha::ParameterMatchers

module CartoDB
  module Importer2

    describe ImporterStats do
      TEST_HOST = '172.28.128.3'
      TEST_PORT = 8125
      TIMING_TEST_KEY = 'test.timing'

      RSpec.configure do |config|
        config.mock_with :mocha
      end

      describe '#timing' do
        it "sends key with importer prefix" do
          expected_send("importer.#{TIMING_TEST_KEY}")
          ImporterStats.instance(TEST_HOST, TEST_PORT).timing(TIMING_TEST_KEY) do foo end
        end

        it "doesn't send anything if host or port are not met" do
          expected_send_nothing
          ImporterStats.instance(nil, nil).timing(TIMING_TEST_KEY) do foo end
          ImporterStats.instance(TEST_HOST, nil).timing(TIMING_TEST_KEY) do foo end
          ImporterStats.instance(nil, TEST_PORT).timing(TIMING_TEST_KEY) do foo end
        end

        it "runs block even without host or port" do
          count = 0
          ImporterStats.instance(nil, nil).timing(TIMING_TEST_KEY) do
            count += 1
          end
          ImporterStats.instance(TEST_HOST, nil).timing(TIMING_TEST_KEY) do
            count += 1
          end
          ImporterStats.instance(nil, TEST_PORT).timing(TIMING_TEST_KEY) do
            count += 1
          end
          count.should eq 3
        end

      end

      def foo
        sleep 0.001
      end

      def expected_send(buf)
        buf_re = Regexp.new(buf)
        UDPSocket.any_instance.expects(:send).with(regexp_matches(buf_re), 0, TEST_HOST, TEST_PORT).once
      end

      def expected_send_nothing
        UDPSocket.any_instance.expects(:send).never
      end

    end
  end
end