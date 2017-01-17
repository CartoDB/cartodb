def stub_domainful(subdomain)
  CartoDB.stubs(:session_domain).returns('.localhost.lan')
  CartoDB.stubs(:subdomainless_urls?).returns(false)
  host! "#{subdomain}.localhost.lan"
end

def stub_subdomainless
  CartoDB.stubs(:session_domain).returns('localhost.lan')
  CartoDB.stubs(:subdomainless_urls?).returns(true)
  host! "localhost.lan"
end
