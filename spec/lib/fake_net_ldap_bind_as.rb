# Monkeypatch overriding bind_as, not supported by FakeNetLdap.
# Patched code:
# https://github.com/ruby-ldap/ruby-net-ldap/blob/3bf849d415a691b5632f2e20cc637e377b15b2ad/lib/net/ldap.rb#L912
# Incomplete fake:
# https://github.com/roovo/fake_net_ldap/blob/a1d20013103c70ed0bb66792286c7657d51c6cf9/lib/fake_net_ldap/ext/net_ldap.rb
class Net::LDAP
  def bind_as(args)
    rs = search(args)
    if rs && rs.first && dn = rs.first[:dn]
      password = args[:password]
      password = password.call if password.respond_to?(:call)
      @username = dn
      @password = password
      rs if bind
    end
  end
end
