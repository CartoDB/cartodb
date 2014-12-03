# coding: UTF-8
require_relative '../app/models/concerns/feature_flaggable.rb'
require 'mocha'
require 'rspec'

class User
  include Concerns::FeatureFlaggable
end

class Cartodb; end

describe User do

  describe 'feature flags' do
    
    describe 'local config' do
      username = 'the_username'
      feature_flag_1 = 'ff1'
      feature_flag_2 = 'ff2'
      feature_flag_3 = 'ff3'
      feature_flag_public = 'ffp'
      feature_flag_restricted = 'ffr'
      feature_flag_config = Hash[:feature_flags, Hash[feature_flag_restricted, { restricted: true }, feature_flag_public, { restricted: false }], :user_feature_flags, Hash[username, [ feature_flag_1, feature_flag_2 ] ]] 

      user = User.new
      user.stubs(:username).returns(username)
      user.stubs(:sync_data_with_cartodb_central?).returns(false)

      Cartodb.stubs(:config).returns(feature_flag_config)

      it 'should have only enabled features for that user' do
        user.feature_flags.include?(feature_flag_1).should eq true
        user.feature_flags.include?(feature_flag_2).should eq true
        user.feature_flags.include?(feature_flag_3).should eq false
      end

      it 'should have public but not unrestricted features' do
        user.feature_flags.include?(feature_flag_public).should eq true
        user.feature_flags.include?(feature_flag_restricted).should eq false
      end
    
    end

  end
        
end
