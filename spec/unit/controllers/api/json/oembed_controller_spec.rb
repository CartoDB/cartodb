# encoding: utf-8

require_relative '../../../../spec_helper'

describe Api::Json::OembedController do

  after(:each) do
    CartoDB.clear_internal_cache
  end

  describe '#private_url_methods_tests' do

    it 'Tests the methods that handle URL manipulation' do
      controller = Api::Json::OembedController.new

      protocol = 'http'
      domain = 'test.local'
      username = 'testuser'
      orgname = 'testorg'

      # from_domainless_url()
      # ---------------------

      # test.local/u/testuser
      url_fragments = [ '', '', domain, '', '', "/u/#{username}" ]
      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}"
      }
      controller.send(:from_domainless_url, url_fragments, protocol, domain).should eq expected_results

      # test.local/u/testuser/something
      url_fragments = [ '', '', domain, '', '', "/u/#{username}/something" ]
      expected_results = {
        username: username,
        organization_name: nil,
        user_profile_url: "#{protocol}://#{domain}/u/#{username}"
      }
      controller.send(:from_domainless_url, url_fragments, protocol, domain).should eq expected_results

      url_fragments = [ '', '', domain, '', '', "/something" ]
      expect {
        controller.send(:from_domainless_url, url_fragments, protocol, domain)
      }.to raise_error "URL needs username specified in the Path"

      url_fragments = [ '', '', domain, '', '', "/u/" ]
      expect {
        controller.send(:from_domainless_url, url_fragments, protocol, domain)
      }.to raise_error "Username not found at url"


      # from_url()
      # ----------
      domain = '.test.local'

      # Because from_url() uses CartoDB.base_url()
      CartoDB.expects(:get_http_port).returns(nil)
      CartoDB.expects(:get_session_domain).returns(domain)

      # .test.local
      url_fragments = [ '', '', "#{domain}", '', '', '' ]
      expect {
        controller.send(:from_url, url_fragments, protocol, domain)
      }.to raise_error "Subdomain not found at url"

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
      }.to raise_error  "Username not found at url"

    end

  end

end
