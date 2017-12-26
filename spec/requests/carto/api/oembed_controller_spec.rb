# encoding: utf-8

require_relative '../../../spec_helper'

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
  end
end

describe Carto::Api::OembedController do

  after(:each) do
    CartoDB.clear_internal_cache
  end

  describe '#json_response_behaviour' do
    before(:each) do
      domain = '.test.local'
      @username = 'testuser'
      @orgname = 'testorg'
      @uuid = "00000000-0000-0000-0000-000000000000"
      @callback = 'callback'
      @uri = "/user/#{@username}/api/v1/oembed?url=http://#{@orgname}#{domain}/u/#{@username}/#{@uuid}"
    end

    it 'Returns JSONP if a callback is specified' do
      uri_with_callback = @uri + "&callback=#{@callback}"
      get uri_with_callback
      response.body.should match(/#{@callback}\(.*\)/)
    end

    it 'Returns regular JSON  if a callback is not' do
      get @uri
      response.body.should_not match(/#{@callback}\(.*\)/)
    end

    it 'Returns regular JSON  if a callback is not' do
      get @uri
      response.body.should_not match(/#{@callback}\(.*\)/)
    end

    it 'Returns valid oembed url' do
      get_json @uri do |response|
        response.status.should eq 200
        embed_url = CartoDB.base_url(@orgname, @username).gsub('http', 'https') + "/viz/#{@uuid}/embed_map"
        response.body[:html].should include embed_url
      end
    end
  end
  describe '#private_url_methods_tests' do

    it 'Tests from_domainless_url()' do
      controller = Carto::Api::OembedController.new

      protocol = 'http'
      domain = 'test.local'
      username = 'testuser'
      orgname = 'testorg'

      # Not testing for now subdomainless support
      CartoDB.expects(:get_subdomainless_urls).at_least(0).returns(false)

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
      }.to raise_error Carto::Api::UrlFRagmentsError, "URL needs username specified in the Path"

      url_fragments = [ '', '', domain, '', '', "/u/" ]
      expect {
        controller.send(:from_domainless_url, url_fragments, protocol)
      }.to raise_error Carto::Api::UrlFRagmentsError, "Username not found at url"
    end


    it 'Tests from_url()' do
      controller = Carto::Api::OembedController.new

      protocol = 'http'
      domain = '.test.local'
      username = 'testuser'
      orgname = 'testorg'

      # Not testing for now subdomainless support
      CartoDB.expects(:get_subdomainless_urls).at_least(0).returns(false)

      CartoDB.expects(:get_http_port).at_least(0).returns(nil)
      CartoDB.expects(:get_session_domain).returns(domain)

      # .test.local
      url_fragments = [ '', '', "#{domain}", '', '', '' ]
      expect {
        controller.send(:from_url, url_fragments, protocol, domain)
      }.to raise_error Carto::Api::UrlFRagmentsError, "Subdomain not found at url"

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
      }.to raise_error   Carto::Api::UrlFRagmentsError, "Username not found at url"
    end

    it 'Tests url_fields_from_fragments()' do
      controller = Carto::Api::OembedController.new

      protocol = 'http'
      username = 'testuser'

      force_https = false

      # Not testing for now subdomainless support
      CartoDB.expects(:get_subdomainless_urls).at_least(0).returns(false)

      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{CartoDB.base_url(username)}",
        protocol: protocol
      }

      controller.send(:url_fields_from_fragments, "#{CartoDB.base_url(username)}", force_https)
        .should eq expected_results

      controller.send(:url_fields_from_fragments, "#{CartoDB.base_url(username)}/something", force_https)
        .should eq expected_results

      CartoDB.clear_internal_cache
      domain = 'carto.com'
      orgname = 'testorg'
      CartoDB.expects(:get_session_domain).returns(domain)
      CartoDB.expects(:get_http_port).at_least(0).returns(nil)            # Easier to test without port specified

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

      expect {
        controller.send(:url_fields_from_fragments, "http://#{domain}", force_https)
      }.to raise_error Carto::Api::UrlFRagmentsError, "URL needs username specified in the Path"

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
      }.to raise_error Carto::Api::UrlFRagmentsError, "Username not found at url"

    end

  end

end
