require_relative '../../lib/url_signer'

describe Carto::UrlSigner do
  describe '#sign_url' do
    it 'behaves like in the example provided' do
      url = 'http://maps.google.com/maps/api/geocode/json?address=New+York&sensor=false&client=clientID'
      private_key = 'vNIXE0xscrmjlyV-12Nj_BvUPaw='
      expected_signed_url = 'http://maps.google.com/maps/api/geocode/json?address=New+York&sensor=false&client=clientID&signature=KrU1TzVQM7Ur0i8i7K3huiw3MsA='
      Carto::UrlSigner.new(private_key).sign_url(url).should == expected_signed_url
    end
  end
end
