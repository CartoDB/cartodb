require 'rails'
require 'ostruct'
require_relative '../rspec_configuration'
require_relative '../../config/initializers/carto_db'

module CartoDB
  class Cartodb
    def config
      {}
    end
  end
end

describe 'CartoDB' do

  describe 'extract_subdomain' do

    it 'extracts subdomain' do
      CartoDB::Cartodb.stubs(:config).returns({ subdomainless_urls: false })
      CartoDB.stubs(:session_domain).returns('.localhost.lan')
      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: ''})).should == ''
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'localhost.lan', params: { user_domain: 'auser'})).should == 'auser'
      CartoDB.extract_subdomain(OpenStruct.new(host: 'auser.localhost.lan', params: { user_domain: 'otheruser'})).should == 'otheruser'
    end

  end

end
