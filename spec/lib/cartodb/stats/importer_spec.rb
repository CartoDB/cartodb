# encoding: utf-8
require_relative '../../../simplecov_helper'
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require_relative '../../../rspec_configuration.rb'

require_relative '../../../../lib/cartodb/stats/importer'

include Mocha::ParameterMatchers

module CartoDB
  module Stats
    describe Importer do
      TEST_HOST = '172.28.128.3'.freeze
      TEST_PORT = 8125
      TIMING_TEST_KEY_A = 'test'.freeze
      TIMING_TEST_KEY_B = 'timing'.freeze
      TIMING_TEST_KEY = "#{TIMING_TEST_KEY_A}.#{TIMING_TEST_KEY_B}".freeze
      GAUGE_TEST_KEY = 'gauge'.freeze
      GAUGE_TEST_VALUE = 0.5
      HOST_INFO = "fake-test-queue".freeze

      EXPECTED_PREFIX = "importer.#{HOST_INFO}".freeze

      describe '#timing' do
        it "sends key with importer prefix" do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY}")
          CartoDB::Stats::Importer.instance(
            {
              'host' => TEST_HOST,
              'port' => TEST_PORT
            }, HOST_INFO).timing(TIMING_TEST_KEY) { foo }
        end

        it "doesn't send anything if host or port are not met" do
          expected_send_nothing
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => nil
          ).timing(TIMING_TEST_KEY) { foo }
          CartoDB::Stats::Importer.instance(
            'host' => TEST_HOST,
            'port' => nil
          ).timing(TIMING_TEST_KEY) { foo }
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => TEST_PORT
          ).timing(TIMING_TEST_KEY) { foo }
        end

        it "runs block even without host or port" do
          count = 0
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => nil
          ).timing(TIMING_TEST_KEY) do
            count += 1
          end
          CartoDB::Stats::Importer.instance(
            'host' => TEST_HOST,
            'port' => nil
          ).timing(TIMING_TEST_KEY) do
            count += 1
          end
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => TEST_PORT
          ).timing(TIMING_TEST_KEY) do
            count += 1
          end
          count.should eq 3
        end

        it "registers nested timing" do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY_A}")
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY}")
          importer_stats = CartoDB::Stats::Importer.instance(
            {
              'host' => TEST_HOST,
              'port' => TEST_PORT
            }, HOST_INFO)
          importer_stats.timing(TIMING_TEST_KEY_A) do
            importer_stats.timing(TIMING_TEST_KEY_B) do
              foo
            end
          end
        end

        it 'sends nothing and discards key fragment if block fails' do
          expected_send("#{EXPECTED_PREFIX}.#{TIMING_TEST_KEY_B}")
          importer_stats = CartoDB::Stats::Importer.instance(
            {
              'host' => TEST_HOST,
              'port' => TEST_PORT
            }, HOST_INFO)
          begin
            importer_stats.timing(TIMING_TEST_KEY_A) do
              raise 'error'
            end
          rescue
            # INFO: keep going
          end
          importer_stats.timing(TIMING_TEST_KEY_B) do
          end
        end
      end

      describe '#gauge' do
        it 'sends key with importer prefix' do
          expected_send("#{EXPECTED_PREFIX}.#{GAUGE_TEST_KEY}")
          CartoDB::Stats::Importer.instance(
            {
              'host' => TEST_HOST,
              'port' => TEST_PORT
            }, HOST_INFO).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
        end

        it "doesn't send anything if host or port are not met" do
          expected_send_nothing
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => nil
          ).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
          CartoDB::Stats::Importer.instance(
            'host' => nil,
            'port' => TEST_PORT
          ).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
          CartoDB::Stats::Importer.instance(
            'host' => TEST_HOST,
            'port' => nil
          ).gauge(GAUGE_TEST_KEY, GAUGE_TEST_VALUE)
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
