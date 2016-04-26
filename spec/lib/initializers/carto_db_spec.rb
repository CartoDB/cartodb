# encoding: utf-8

require_relative '../../spec_helper'
require_relative '../../../spec/doubles/request'

module CartoDB
  def self.clear_internal_cache
    remove_class_variable(:@@request_host) if defined?(@@request_host)
    remove_class_variable(:@@hostname) if defined?(@@hostname)
    remove_class_variable(:@@http_port) if defined?(@@http_port)
    remove_class_variable(:@@https_port) if defined?(@@http_ports)
    remove_class_variable(:@@session_domain) if defined?(@@session_domain)
    remove_class_variable(:@@domain) if defined?(@@domain)
    remove_class_variable(:@@subdomainless_urls) if defined?(@@subdomainless_urls)
    remove_class_variable(:@@account_host) if defined?(@@account_host)
    remove_class_variable(:@@account_path) if defined?(@@account_path)
    remove_class_variable(:@@data_library_path) if defined?(@@data_library_path)
  end
end

describe CartoDB do
  after(:each) do
    CartoDB.clear_internal_cache
  end

  describe '#url_methods' do

    it 'Tests extract_real_subdomain()' do
      username = 'test'
      expected_session_domain = '.cartodb.com'

      CartoDB.clear_internal_cache
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}"
                                     })
      CartoDB.subdomain_from_request(request).should eq username
    end

    it 'Tests extract_host_subdomain()' do
      username = 'test'
      expected_session_domain = '.cartodb.com'

      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      # test.cartodb.com
      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}"
                                     })
      CartoDB.extract_host_subdomain(request).should eq nil

      # test.cartodb.com/u/whatever
      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}",
                                       params: {
                                         user_domain: 'whatever'
                                       }
                                     })
      CartoDB.extract_host_subdomain(request).should eq username
    end

    it 'Tests extract_subdomain() and username_from_request()' do
      username = 'test'
      orgname = 'testorg'
      user_domain = 'whatever'
      expected_session_domain = '.cartodb.com'

      CartoDB.expects(:get_session_domain).at_least(0).returns(expected_session_domain)

      # testorg.cartodb.com/u/whatever
      request = Doubles::Request.new({
                                       host: "#{orgname}#{expected_session_domain}",
                                       params: {
                                         user_domain: user_domain
                                       }
                                     })
      CartoDB.username_from_request(request).should eq user_domain
      # test.cartodb.com
      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}"
                                     })
      CartoDB.username_from_request(request).should eq nil

      # For extract_subdomain() no need to call again real methods

      user_domain_param = "test_user"
      host_username = "another_user"
      host = "#{host_username}#{expected_session_domain}"

      CartoDB.extract_subdomain(Doubles::Request.new({
                                                       params: { user_domain: user_domain_param}
                                                     }))
        .should eq user_domain_param

      CartoDB.extract_subdomain(Doubles::Request.new({
                                                       host: host
                                                     }))
      .should eq host_username
    end

    it 'Tests base_url()' do
      expected_session_domain = '.cartodb.com'
      expected_http_port = ':12345'
      expected_https_port = ':67890'
      username = 'test'
      orgname = 'testorg'
      protocol_override_https = 'https'
      protocol_override_http = 'http'

      CartoDB.expects(:get_subdomainless_urls).returns(false)

      CartoDB.expects(:use_https?).at_least(0).returns(false)
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)
      CartoDB.expects(:get_http_port).at_least(1).returns(expected_http_port)
      CartoDB.expects(:get_https_port).at_least(1).returns(expected_https_port)

      CartoDB.base_url(username, nil, nil).should eq "http://#{username}#{expected_session_domain}#{expected_http_port}"

      CartoDB.base_url(username, nil, protocol_override_https)
        .should eq "#{protocol_override_https}://#{username}#{expected_session_domain}#{expected_https_port}"

      CartoDB.base_url(orgname, username, nil)
        .should eq "http://#{orgname}#{expected_session_domain}#{expected_http_port}/u/#{username}"

      CartoDB.base_url(orgname, username, protocol_override_https)
        .should eq "#{protocol_override_https}://#{orgname}#{expected_session_domain}#{expected_https_port}/u/#{username}"

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).at_least(0).returns(true)

      CartoDB.base_url(username, nil, nil)
        .should eq "https://#{username}#{expected_session_domain}#{expected_https_port}"

      CartoDB.base_url(username, nil, protocol_override_http)
        .should eq "#{protocol_override_http}://#{username}#{expected_session_domain}#{expected_http_port}"

      # Reset and check without subdomains
      CartoDB.clear_internal_cache

      expected_session_domain = 'cartodb.com'

      CartoDB.unstub(:get_subdomainless_urls)
      CartoDB.expects(:get_subdomainless_urls).returns(true)

      CartoDB.unstub(:get_session_domain)
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)
      CartoDB.expects(:use_https?).at_least(0).returns(false)

      CartoDB.base_url(username, nil, nil)
        .should eq "http://#{expected_session_domain}#{expected_http_port}/user/#{username}"

      CartoDB.base_url(username, nil, protocol_override_https)
        .should eq "#{protocol_override_https}://#{expected_session_domain}#{expected_https_port}/user/#{username}"

      # Because without subdomains organizations are ignored, acts as previous scenario
      CartoDB.base_url(orgname, username, nil)
        .should eq "http://#{expected_session_domain}#{expected_http_port}/user/#{orgname}"

      CartoDB.base_url(orgname, username, protocol_override_https)
      .should eq "#{protocol_override_https}://#{expected_session_domain}#{expected_https_port}/user/#{orgname}"

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).at_least(0).returns(true)

      CartoDB.base_url(username, nil, nil)
        .should eq "https://#{expected_session_domain}#{expected_https_port}/user/#{username}"

      CartoDB.base_url(username, nil, protocol_override_http)
        .should eq "#{protocol_override_http}://#{expected_session_domain}#{expected_http_port}/user/#{username}"
    end

    it 'tests base_url() without logged user' do
      expected_session_domain = 'cartodb.com'
      expected_ip = '127.0.0.1'
      expected_https_port = ':67890'

      CartoDB.clear_internal_cache
      CartoDB.stubs(:use_https?).returns(true)
      CartoDB.stubs(:get_https_port).returns(expected_https_port)

      CartoDB.stubs(:get_subdomainless_urls).returns(true)
      CartoDB.stubs(:get_session_domain).returns(expected_session_domain)
      CartoDB.base_url(nil, nil, nil).should eq "https://#{expected_session_domain}#{expected_https_port}"

      CartoDB.stubs(:request_host).returns(expected_ip)
      CartoDB.base_url(nil, nil, nil).should eq "https://#{expected_ip}#{expected_https_port}"
    end

  end

end
