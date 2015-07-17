# encoding: utf-8

require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require_relative '../../lib/importer/importer_stats'
require_relative '../../../../spec/rspec_configuration.rb'

include Mocha::ParameterMatchers

module CartoDB
  module Importer2

    describe ImporterStats do
      TEST_HOST = '172.28.128.3'
      TEST_PORT = 8125
      TIMING_TEST_KEY_A = 'test'
      TIMING_TEST_KEY_B = 'timing'
      TIMING_TEST_KEY = "#{TIMING_TEST_KEY_A}.#{TIMING_TEST_KEY_B}"
      GAUGE_TEST_KEY = 'gauge'
      GAUGE_TEST_VALUE = 0.5
      HOST_INFO = "fake-test-queue"

      EXPECTED_PREFIX = "importer.#{HOST_INFO}"

      describe '#timing' do
        it "sends key with importer prefix" do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY}")
          ImporterStats.instance(TEST_HOST, TEST_PORT, HOST_INFO).timing(TIMING_TEST_KEY) do foo end
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

        it "registers nested timing" do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY_A}")
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY}")
          importer_stats = ImporterStats.instance(TEST_HOST, TEST_PORT, HOST_INFO)
          importer_stats.timing(TIMING_TEST_KEY_A) do
            importer_stats.timing(TIMING_TEST_KEY_B) do
              foo
            end
          end
        end

        it 'sends nothing and discards key fragment if block fails' do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY_B}")
          importer_stats = ImporterStats.instance(TEST_HOST, TEST_PORT, HOST_INFO)
          begin
            importer_stats.timing(TIMING_TEST_KEY_A) do
              raise 'error'
            end
          rescue => e
            # INFO: keep going
          end
          importer_stats.timing(TIMING_TEST_KEY_B) do
          end
        end

      end

      describe '#gauge' do

        it 'sends key with importer prefix' do
          expected_send("#{EXPECTED_PREFIX}.#{GAUGE_TEST_KEY}")
          ImporterStats.instance(TEST_HOST, TEST_PORT, HOST_INFO).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
        end

        it "doesn't send anything if host or port are not met" do
          expected_send_nothing
          ImporterStats.instance(nil, nil).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
          ImporterStats.instance(nil, TEST_PORT).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
          ImporterStats.instance(TEST_HOST, nil).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
        end
      end

      def foo
        sleep 0.001
      end

      def expected_send(buf)
        buf_re = %r{^#{buf}:}
        UDPSocket.any_instance.expects(:send).with(regexp_matches(buf_re), 0, TEST_HOST, TEST_PORT).once
      end

      def expected_send_nothing
        UDPSocket.any_instance.expects(:send).never
      end

    end
  end
end
