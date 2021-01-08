def stub_domainful(subdomain)
  allow(CartoDB).to receive(:session_domain).and_return('.localhost.lan')
  allow(CartoDB).to receive(:subdomainless_urls?).and_return(false)
  host! "#{subdomain}.localhost.lan"
end

def stub_subdomainless
  allow(CartoDB).to receive(:session_domain).and_return('localhost.lan')
  allow(CartoDB).to receive(:subdomainless_urls?).and_return(true)
  host! "localhost.lan"
end
