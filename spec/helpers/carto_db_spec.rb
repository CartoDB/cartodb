require 'rails'
require 'ostruct'
require_relative '../rspec_configuration'
require_relative '../../config/initializers/carto_db'

# Just "open" the modules so that we make sure they are defined,
#  but do not overwrite anything so that it doesn't affect other tests.
module CartoDB
  module Cartodb; end
end

describe 'CartoDB' do

  describe '#is_ip?' do
    it 'detects ips' do
      CartoDB.is_ip?(nil).should == false
      CartoDB.is_ip?('').should == false
      CartoDB.is_ip?('.').should == false
      CartoDB.is_ip?('...').should == false
      CartoDB.is_ip?(192).should == false
      CartoDB.is_ip?('a').should == false
      CartoDB.is_ip?('a.b.c.d').should == false
      CartoDB.is_ip?('192.168.1.').should == false
      CartoDB.is_ip?('192.168.1.0').should == true
    end
  end

  describe 'extract_subdomain' do
    it 'extracts subdomain without subdomainless_urls' do
      CartoDB::Cartodb.stubs(:config).returns({ subdomainless_urls: false })
      CartoDB.stubs(:session_domain).returns('.localhost.lan')
      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: ''})).should == ''
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'otheruser'})).should == 'otheruser'
    end

    it 'extracts subdomain with subdomainless_urls' do
      CartoDB::Cartodb.stubs(:config).returns({ subdomainless_urls: false })
      CartoDB.stubs(:session_domain).returns('.localhost.lan')

      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: ''})).should == ''
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'otheruser'})).should == 'otheruser'

      CartoDB.extract_subdomain(OpenStruct.new(host: '192.168.1.1', params: { user_domain: ''})).should == ''
      CartoDB.extract_subdomain(OpenStruct.new(host: '192.168.1.1', params: { user_domain: 'otheruser'})).should == 'otheruser'
    end
  end

end
