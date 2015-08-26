# coding: UTF-8
require_relative '../../../spec_helper'

require 'fake_net_ldap'

describe Carto::Ldap::Configuration do
  include_context 'organization with users helper'


  it 'tests authentication' do

    auth_username = 'carto_admin'
    auth_password = '123456'

    user_domain_base = "cn=#{auth_username}"

    domain_bases = [ user_domain_base, "dc=cartodb" ]

    ldap_configuration = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases: domain_bases,
        connection_user: domain_bases,
        connection_password: auth_password,
        email_field: '.',
        user_object_class: '.',
        group_object_class: '.',
        user_id_field: 'cn'
      })

    FakeNetLdap.register_user(:username => domain_bases.join(','), :password => auth_password)

    filter = Net::LDAP::Filter.eq('cn', auth_username)
    FakeNetLdap.register_query(filter, { 
          ldap_configuration.user_id_field => [auth_username]
        })

    result = ldap_configuration.authenticate(auth_username, auth_password)

    result.should_not eq false
    result.class.should eq Carto::Ldap::Entry
    result.user_id.should eq auth_username

    ldap_configuration.delete
  end

end
