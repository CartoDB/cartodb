# encoding: utf-8

require_relative '../../../../spec_helper'

describe Api::Json::OembedController do

  after(:each) do
    CartoDB.clear_internal_cache
  end

  describe '#private_url_methods_tests' do

    it 'Tests from_domainless_url()' do
      controller = Api::Json::OembedController.new

      protocol = 'http'
      domain = 'test.local'
      username = 'testuser'
      orgname = 'testorg'

      # test.local/u/testuser
      url_fragments = [ '', '', domain, '', '', "/u/#{username}" ]
      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}"
      }
      controller.send(:from_domainless_url, url_fragments, protocol).should eq expected_results

      # test.local/u/testuser/something
      url_fragments = [ '', '', domain, '', '', "/u/#{username}/something" ]
      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}"
      }
      controller.send(:from_domainless_url, url_fragments, protocol).should eq expected_results

      url_fragments = [ '', '', domain, '', '', "/something" ]
      expect {
        controller.send(:from_domainless_url, url_fragments, protocol)
      }.to raise_error UrlFRagmentsError, "URL needs username specified in the Path"

      url_fragments = [ '', '', domain, '', '', "/u/" ]
      expect {
        controller.send(:from_domainless_url, url_fragments, protocol)
      }.to raise_error UrlFRagmentsError, "Username not found at url"
    end

    it 'Tests from_url()' do
      controller = Api::Json::OembedController.new

      protocol = 'http'
      domain = '.test.local'
      username = 'testuser'
      orgname = 'testorg'

      # Because from_url() uses CartoDB.base_url()
      CartoDB.expects(:get_http_port).returns(nil)
      CartoDB.expects(:get_session_domain).returns(domain)

      # .test.local
      url_fragments = [ '', '', "#{domain}", '', '', '' ]
      expect {
        controller.send(:from_url, url_fragments, protocol, domain)
      }.to raise_error UrlFRagmentsError, "Subdomain not found at url"

      # testuser.test.local
      url_fragments = [ '', '', "#{username}#{domain}", '', '', '/vis' ]
      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{username}#{domain}"
      }
      controller.send(:from_url, url_fragments, protocol, domain).should eq expected_results

      # testorg.test.local/u/testuser/vis
      url_fragments = [ '', '', "#{orgname}#{domain}", '', '', "/u/#{username}/vis" ]
      expected_results = {
        username: username,
        organization_name: orgname,
        user_profile_url: "#{protocol}://#{orgname}#{domain}/u/#{username}"
      }
      controller.send(:from_url, url_fragments, protocol, domain).should eq expected_results

      url_fragments = [ '', '', "#{orgname}#{domain}", '', '', "/u//vis" ]
      expect {
        controller.send(:from_url, url_fragments, protocol, domain)
      }.to raise_error  UrlFRagmentsError, "Username not found at url"
    end

    it 'Tests url_fields_from_fragments()' do
      controller = Api::Json::OembedController.new

      protocol = 'http'
      domain = 'test.local'
      username = 'testuser'

      force_https = false

      # easy scenario
      CartoDB.expects(:get_subdomains_optional).at_least(0).returns(false)
      CartoDB.expects(:get_subdomains_allowed).returns(false)

      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{CartoDB.base_url(username)}/u/#{username}",
        protocol: protocol
      }

      controller.send(:url_fields_from_fragments, "#{CartoDB.base_url(username)}/u/#{username}", force_https)
        .should eq expected_results

      controller.send(:url_fields_from_fragments, "#{CartoDB.base_url(username)}/u/#{username}/something", force_https)
        .should eq expected_results

      #

      CartoDB.clear_internal_cache
      domain = 'cartodb.com'
      orgname = 'testorg'
      CartoDB.expects(:get_subdomains_optional).at_least(0).returns(false)
      CartoDB.expects(:get_session_domain).returns(domain)
      CartoDB.expects(:get_subdomains_allowed).returns(true)
      CartoDB.expects(:get_http_port).returns(nil)            # Easier to test without port specified

      # domainless urls allowing subdomains

      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}",
        protocol: protocol
      }
      controller.send(:url_fields_from_fragments, "http://#{domain}/u/#{username}", force_https)
      .should eq expected_results

      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}",
        protocol: protocol
      }
      controller.send(:url_fields_from_fragments, "http://#{domain}/u/#{username}/something", force_https)
      .should eq expected_results

      # subdomain-based urls

      expect {
        controller.send(:url_fields_from_fragments, "http://#{domain}", force_https)
      }.to raise_error UrlFRagmentsError, "URL needs username specified in the Path"

      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{username}#{domain}",
        protocol: protocol
      }
      controller.send(:url_fields_from_fragments, "http://#{username}#{domain}/vis", force_https)
        .should eq expected_results

      expected_results = {
        username: username,
        organization_name: orgname,
        user_profile_url: "#{protocol}://#{orgname}#{domain}/u/#{username}",
        protocol: protocol
      }
      controller.send(:url_fields_from_fragments, "http://#{orgname}#{domain}/u/#{username}/vis", force_https)
        .should eq expected_results

      expect {
        controller.send(:url_fields_from_fragments, "http://#{orgname}#{domain}/u//vis", force_https)
      }.to raise_error  UrlFRagmentsError, "Username not found at url"

    end

  end

end
