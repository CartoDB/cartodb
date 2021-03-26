require 'spec_helper_min'
require_relative '../../lib/carto/url_validator'

class Carto::UrlValidatorInstance
  include Carto::UrlValidator
end

describe 'UUIDHelper' do
  before(:each) do
    @url_validator = Carto::UrlValidatorInstance.new
  end

  it 'raises an error if the URL is not valid at all' do
    expect { @url_validator.validate_url!("foo://bar-zzz.com") }
      .to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'raises an error if it points to a non-standard port' do
    expect { @url_validator.validate_url!("http://example.com:8080") }
      .to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'raises an error if the IP is blacklisted' do
    @url_validator.instance_variable_set("@blacklisted_ip_ranges", [IPAddr.new("169.254.169.1")])
    expect { @url_validator.validate_url!("http://169.254.169.1/blob/blub.csv") }
      .to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'raises an error if the IP belongs to a blacklisted range' do
    @url_validator.instance_variable_set("@blacklisted_ip_ranges", [IPAddr.new("10.0.0.0/8")])
    expect { @url_validator.validate_url!("http://10.0.0.92/blob/blub.csv") }
      .to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'does nothing if everything is ok' do
    @url_validator.instance_variable_set("@blacklisted_ip_ranges", [IPAddr.new("169.254.169.1")])
    @url_validator.validate_url!("http://169.254.169.2/foo.csv")
    @url_validator.validate_url!("http://example.com/foo.csv")
    @url_validator.validate_url!("https://example.com/bar.kml")
    @url_validator.validate_url!("http://example.com/foo.csv:80")
    @url_validator.validate_url!("https://example.com/bar.kml:443")
  end

  it 'allows ftp' do
    expect { @url_validator.validate_url!("ftp://example.com") }.to_not raise_error
  end
end
