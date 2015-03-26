# encoding: utf-8

require_relative '../../spec_helper'
require_relative '../../../spec/doubles/request'

describe CartoDB do
  after(:each) do
    CartoDB.clear_internal_cache
  end

  describe '#url_methods' do

    it 'Tests extract_real_subdomain()' do
      username = 'test'
      expected_session_domain = '.cartodb.com'

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

      CartoDB.expects(:get_session_domain).returns(expected_session_domain)
      CartoDB.expects(:get_http_port).returns(expected_http_port)
      CartoDB.expects(:get_https_port).returns(expected_https_port)

      CartoDB.base_url(username, nil, nil).should eq "http://#{username}#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(username, nil, protocol_override_https)
        .should eq "#{protocol_override_https}://#{username}#{expected_session_domain}#{expected_https_port}"
      CartoDB.base_url(orgname, username, nil)
        .should eq "http://#{orgname}#{expected_session_domain}#{expected_http_port}/u/#{username}"
      CartoDB.base_url(orgname, username, protocol_override_https)
        .should eq "#{protocol_override_https}://#{orgname}#{expected_session_domain}#{expected_https_port}/u/#{username}"

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).times(2).returns(true)
      CartoDB.base_url(username, nil, nil)
        .should eq "https://#{username}#{expected_session_domain}#{expected_https_port}"
      CartoDB.base_url(username, nil, protocol_override_http)
      .should eq "#{protocol_override_http}://#{username}#{expected_session_domain}#{expected_http_port}"

      # Reset
      # TODO: Pending with subdomains optional set to true

      #CartoDB.expects(:get_subdomainless_urls).returns(true)

    end

  end

end
