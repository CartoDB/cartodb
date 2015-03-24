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
      CartoDB.extract_real_subdomain(request).should eq username
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

    it 'Tests extract_subdomain() extract_subdomain_flexible() and extract_subdomain_strict()' do
      username = 'test'
      orgname = 'testorg'
      user_domain = 'whatever'
      expected_session_domain = '.cartodb.com'

      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      # test.cartodb.com
      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}"
                                     })
      CartoDB.extract_username_flexible(request).should eq username

      # testorg.cartodb.com/u/whatever
      request = Doubles::Request.new({
                                       host: "#{orgname}#{expected_session_domain}",
                                       params: {
                                         user_domain: user_domain
                                       }
                                     })
      CartoDB.extract_username_flexible(request).should eq user_domain

      # testorg.cartodb.com/u/whatever
      request = Doubles::Request.new({
                                       host: "#{orgname}#{expected_session_domain}",
                                       params: {
                                         user_domain: user_domain
                                       }
                                     })
      CartoDB.extract_username_strict(request).should eq user_domain
      # test.cartodb.com
      request = Doubles::Request.new({
                                       host: "#{username}#{expected_session_domain}"
                                     })
      CartoDB.extract_username_strict(request).should eq nil

      # For extract_subdomain() no need to call again real methods

      expected_response_with_subdomains = "flexible"
      expected_response_without_subdomains = "strict"

      CartoDB.expects(:subdomains_allowed?).returns(true)
      CartoDB.expects(:extract_username_flexible).returns(expected_response_with_subdomains)

      CartoDB.extract_subdomain(Doubles::Request.new).should eq expected_response_with_subdomains

      CartoDB.expects(:subdomains_allowed?).returns(false)
      CartoDB.unstub(:extract_username_flexible)
      CartoDB.expects(:extract_username_strict).returns(expected_response_without_subdomains)

      CartoDB.extract_subdomain(Doubles::Request.new).should eq expected_response_without_subdomains
    end

    it 'Tests base_url()' do
      expected_session_domain = '.cartodb.com'
      expected_http_port = ':12345'
      username = 'test'
      orgname = 'testorg'
      protocol_override_https = 'https'
      protocol_override_http = 'http'

      CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)

      CartoDB.expects(:get_session_domain).returns(expected_session_domain)
      CartoDB.expects(:get_http_port).returns(expected_http_port)

      CartoDB.expects(:use_https?).at_least(4).returns(false)

      CartoDB.expects(:get_subdomains_allowed).returns(true)
      CartoDB.base_url(username, nil, nil).should eq "http://#{username}#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(username, nil, protocol_override_https)
        .should eq "#{protocol_override_https}://#{username}#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(orgname, username, nil)
        .should eq "http://#{orgname}#{expected_session_domain}#{expected_http_port}/u/#{username}"
      CartoDB.base_url(orgname, username, protocol_override_https)
        .should eq "#{protocol_override_https}://#{orgname}#{expected_session_domain}#{expected_http_port}/u/#{username}"

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).times(2).returns(true)
      CartoDB.base_url(username, nil, nil)
        .should eq "https://#{username}#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(username, nil, protocol_override_http)
      .should eq "#{protocol_override_http}://#{username}#{expected_session_domain}#{expected_http_port}"

      # Reset
      expected_session_domain = 'cartodb.com'   # Notice dot removed
      CartoDB.clear_internal_cache

      CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)

      CartoDB.unstub(:get_session_domain)
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)
      CartoDB.unstub(:get_http_port)
      CartoDB.expects(:get_http_port).returns(expected_http_port)

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).at_least(4).returns(false)

      CartoDB.unstub(:get_subdomains_allowed)
      CartoDB.expects(:get_subdomains_allowed).returns(false)
      CartoDB.base_url(username, nil, nil).should eq "http://#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(username, nil, protocol_override_https)
        .should eq "#{protocol_override_https}://#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(orgname, username, nil)
        .should eq "http://#{expected_session_domain}#{expected_http_port}"
      CartoDB.base_url(orgname, username, protocol_override_https)
        .should eq "#{protocol_override_https}://#{expected_session_domain}#{expected_http_port}"

      CartoDB.unstub(:use_https?)
      CartoDB.expects(:use_https?).at_least(2).returns(true)

      CartoDB.base_url(username, nil, nil).should eq "https://#{expected_session_domain}#{expected_http_port}"

      CartoDB.base_url(username, nil, protocol_override_http)
        .should eq "#{protocol_override_http}://#{expected_session_domain}#{expected_http_port}"

      # TODO: Pending with subdomains optional set to true

    end

  end

  # Splitted into multiple tests to avoid the almost-useless error trace in case of unsatisfied expectations
  describe 'Tests detect_url_format() with all combinations' do

    # Requests with subdomain

    it 'subdomain request with subdomains on and optional' do
      username = 'test'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{username}#{expected_session_domain}",
                                                    fullpath: ""
                                                  })).should eq false
    end

    it 'subdomain request with subdomains on and mandatory' do
      username = 'test'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{username}#{expected_session_domain}",
                                                    fullpath: ""
                                                  })).should eq false
    end

    it 'subdomain request with subdomains off and optional' do
      username = 'test'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{username}#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'subdomain request with subdomains off and mandatory' do
      username = 'test'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{username}#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'subdomain organization request with subdomains on and optional' do
      username = 'test'
      orgname = 'testorg'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{orgname}#{expected_session_domain}",
                                                    fullpath: "/u/#{username}"
                                                  })).should eq false
    end

    it 'subdomain organization request with subdomains on and mandatory' do
      username = 'test'
      orgname = 'testorg'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{orgname}#{expected_session_domain}",
                                                    fullpath: "/u/#{username}"
                                                  })).should eq false
    end

    it 'subdomain organization request with subdomains off and optional' do
      username = 'test'
      orgname = 'testorg'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{orgname}#{expected_session_domain}",
                                                      fullpath: "/u/#{username}"
                                                    })).should eq false
      }.to raise_error
    end

    it 'subdomain organization request with subdomains off and mandatory' do
      username = 'test'
      orgname = 'testorg'
      expected_session_domain = '.cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{orgname}#{expected_session_domain}",
                                                      fullpath: "/u/#{username}"
                                                    }))
      }.to raise_error
    end

    # Now subdomainless requests

    it 'domainless request without user, with subdomains on and optional' do
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'domainless request without user, with subdomains on and mandatory' do
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'domainless request without user, with subdomains off and optional' do
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'domainless request without user, with subdomains off and mandatory' do
      username = 'test'
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{expected_session_domain}",
                                                      fullpath: ""
                                                    }))
      }.to raise_error
    end

    it 'domainless request with user, with subdomains on and optional' do
      username = 'test'
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{expected_session_domain}",
                                                    fullpath: "/u/#{username}"
                                                  })).should eq true
    end

    it 'domainless request with user, with subdomains on and mandatory' do
      username = 'test'
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      expect {
        CartoDB.expects(:subdomains_allowed?).at_least(1).returns(true)
        CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
        CartoDB.is_domainless?(Doubles::Request.new({
                                                      host: "#{expected_session_domain}",
                                                      fullpath: "/u/#{username}"
                                                    }))
      }.to raise_error
    end

    it 'domainless request with user, with subdomains off and optional' do
      username = 'test'
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(true)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{expected_session_domain}",
                                                    fullpath: "/u/#{username}"
                                                  })).should eq true
    end

    it 'domainless request with user, with subdomains off and mandatory' do
      username = 'test'
      expected_session_domain = 'cartodb.com'
      CartoDB.expects(:get_session_domain).returns(expected_session_domain)

      CartoDB.expects(:subdomains_allowed?).at_least(1).returns(false)
      CartoDB.expects(:subdomains_optional?).at_least(0).returns(false)
      CartoDB.is_domainless?(Doubles::Request.new({
                                                    host: "#{expected_session_domain}",
                                                    fullpath: "/u/#{username}"
                                                  })).should eq true
    end

  end

end
