require 'spec_helper_min'
require_relative '../../platform_limits'
require_relative '../doubles/user'

include CartoDB::PlatformLimits

class EmptyClass; end

describe Importer::InputFileSize do
  describe "#methods" do

    it "new(), maximum_limit?(),  key()" do
      max_value = 50*1024*1024

      fake_user_1 = CartoDB::PlatformLimits::Doubles::User.new({username: 'test_1', max_import_file_size: max_value })
      fake_user_2 = CartoDB::PlatformLimits::Doubles::User.new({username: 'test_1', max_import_file_size: max_value })

      options_1 = {
        user: fake_user_1
      }

      options_2 = {
        user: fake_user_2,
        ip: 12345,
        initial_value: 1,
        max_value: 5, # Should get overriden
        ttl: 10
      }

      expect {
        Importer::InputFileSize.new({})
      }.to raise_exception ArgumentError
      expect {
        Importer::InputFileSize.new({ user: EmptyClass.new })
      }.to raise_exception ArgumentError
      expect {
        Importer::InputFileSize.new({ user: CartoDB::PlatformLimits::Doubles::User.new({username: 'invalid', max_import_file_size: -1}) })
      }.to raise_exception ArgumentError
      expect {
        Importer::InputFileSize.new({ user: CartoDB::PlatformLimits::Doubles::User.new({username: 'invalid', max_import_file_size: 0}) })
      }.to raise_exception ArgumentError
      expect {
        Importer::InputFileSize.new({ user: CartoDB::PlatformLimits::Doubles::User.new({username: 'invalid', max_import_file_size: nil}) })
      }.to raise_exception ArgumentError

      instance = Importer::InputFileSize.new(options_1)

      instance.maximum_limit?.should eq max_value

      instance.send(:ip).should eq nil
      instance.send(:user).should eq options_1[:user]
      instance.send(:initial_value).should eq nil
      instance.send(:max_value).should eq max_value
      instance.send(:time_frame).should eq nil
      instance.send(:current_value).should eq nil

      instance.key.should eq "limits:Importer:InputFileSize:u:#{options_1[:user].username}"

      instance = Importer::InputFileSize.new(options_2)

      instance.maximum_limit?.should eq max_value

      instance.send(:ip).should eq options_2[:ip]
      instance.send(:user).should eq options_2[:user]
      instance.send(:initial_value).should eq options_2[:initial_value]
      instance.send(:max_value).should eq max_value
      instance.send(:time_frame).should eq options_2[:ttl]
      instance.send(:current_value).should eq nil

      instance.key.should eq "limits:Importer:InputFileSize:ui:#{options_2[:user].username}#{options_2[:ip]}"
    end

    it "is_over_limit?/! and is_within_limit?/!" do
      max_value = 50*1024*1024

      options = {
        user: CartoDB::PlatformLimits::Doubles::User.new({username: 'test_1', max_import_file_size: max_value })
      }

      instance = Importer::InputFileSize.new(options)

      ok_value = 10
      limit_value = instance.maximum_limit?
      exceeded_value = max_value + 1

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
