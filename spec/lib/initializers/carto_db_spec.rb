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

    end

  end

end
