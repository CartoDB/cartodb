# encoding: utf-8

require_relative '../../platform_limits'
require 'uuidtools'

include CartoDB::PlatformLimits

describe Importer::InputFileSize do
  describe "#methods" do

    it "new(), maximum_limit?(),  key()" do
      options_1 = {
        user: UUIDTools::UUID.timestamp_create.to_s
      }

      options_2 = {
        user: UUIDTools::UUID.timestamp_create.to_s,
        ip: 12345,
        initial_value: 1,
        max_value: 5, # Should get overriden
        ttl: 10
      }

      expected_max_value = LimitsConfig::IMPORTER_LIMITS[Importer::InputFileSize.classname][:max_value]

      expect {
        Importer::InputFileSize.new({})
      }.to raise_exception ArgumentError

      instance = Importer::InputFileSize.new(options_1)

      instance.maximum_limit?.should eq expected_max_value

      instance.send(:ip).should eq nil
      instance.send(:user).should eq options_1[:user]
      instance.send(:initial_value).should eq nil
      instance.send(:max_value).should eq expected_max_value
      instance.send(:time_frame).should eq nil
      instance.send(:current_value).should eq nil

      instance.key.should eq "limits:Importer:InputFileSize:u:#{options_1[:user]}"

      instance = Importer::InputFileSize.new(options_2)

      instance.maximum_limit?.should eq expected_max_value

      instance.send(:ip).should eq options_2[:ip]
      instance.send(:user).should eq options_2[:user]
      instance.send(:initial_value).should eq options_2[:initial_value]
      instance.send(:max_value).should eq expected_max_value
      instance.send(:time_frame).should eq options_2[:ttl]
      instance.send(:current_value).should eq nil

      instance.key.should eq "limits:Importer:InputFileSize:ui:#{options_2[:user]}#{options_2[:ip]}"
    end

    it "is_over_limit?/! and is_within_limit?/!" do
      options = {
        user: UUIDTools::UUID.timestamp_create.to_s
      }

      instance = Importer::InputFileSize.new(options)

      ok_value = 10
      limit_value = instance.maximum_limit?
      exceeded_value = LimitsConfig::IMPORTER_LIMITS[Importer::InputFileSize.classname][:max_value] + 1

      expect {
        instance.is_over_limit?('a')
      }.to raise_exception ArgumentError
      expect {
        instance.is_over_limit?('1')
      }.to raise_exception ArgumentError
      expect {
        instance.is_over_limit?(2.0)
      }.to raise_exception ArgumentError
      expect {
        instance.is_over_limit?(nil)
      }.to raise_exception ArgumentError
      expect {
        instance.is_over_limit?([2])
      }.to raise_exception ArgumentError
      expect {
        instance.is_over_limit?({ 1 => 2})
      }.to raise_exception ArgumentError

      instance.is_over_limit?(0).should eq false
      instance.is_over_limit!(0).should eq false
      instance.is_within_limit?(0).should eq true
      instance.is_within_limit!(0).should eq true

      instance.is_over_limit?(ok_value).should eq false
      instance.is_over_limit!(ok_value).should eq false
      instance.is_within_limit?(ok_value).should eq true
      instance.is_within_limit!(ok_value).should eq true

      instance.is_over_limit?(limit_value).should eq false
      instance.is_over_limit!(limit_value).should eq false
      instance.is_within_limit?(limit_value).should eq true
      instance.is_within_limit!(limit_value).should eq true

      instance.is_over_limit?(exceeded_value).should eq true
      instance.is_over_limit!(exceeded_value).should eq true
      instance.is_within_limit?(exceeded_value).should eq false
      instance.is_within_limit!(exceeded_value).should eq false
    end

  end
end
