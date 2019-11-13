require_relative '../../../lib/carto/email_domain_validator.rb'

module Carto
  describe EmailDomainValidator do
    describe '#validate email domains against whitelist' do
      it 'validate a non-wildcard domain' do
        Carto::EmailDomainValidator.validate_domain('test@carto.com', ['carto.com']).should == true
      end

      it 'Error on not whitelisted domain' do
        Carto::EmailDomainValidator.validate_domain('test@test.com', ['carto.com']).should == false
      end

      it 'validate wildcard domain' do
        Carto::EmailDomainValidator.validate_domain('test@a.carto.com', ['*.carto.com']).should == true
        Carto::EmailDomainValidator.validate_domain('test@a.b.carto.com', ['*.carto.com']).should == true
        Carto::EmailDomainValidator.validate_domain('test@a.b.c.carto.com', ['*.carto.com']).should == true
      end

      it 'validate subdomains wildcard' do
        Carto::EmailDomainValidator.validate_domain('test@b.a.carto.com', ['*.a.carto.com']).should == true
        Carto::EmailDomainValidator.validate_domain('test@b.b.carto.com', ['*.a.carto.com']).should == false
      end

      it 'validate multiple domains' do
        whitelisted_domains = ['carto.com', '*.mit.edu', '*.cs.harvard.edu']
        Carto::EmailDomainValidator.validate_domain('test@carto.com', whitelisted_domains).should == true
        Carto::EmailDomainValidator.validate_domain('test@a.b.carto.com', whitelisted_domains).should == false
        Carto::EmailDomainValidator.validate_domain('test@cs.mit.edu', whitelisted_domains).should == true
        Carto::EmailDomainValidator.validate_domain('test@a.cs.harvard.edu', whitelisted_domains).should == true
        Carto::EmailDomainValidator.validate_domain('test@a.bio.harvard.edu', whitelisted_domains).should == false
        Carto::EmailDomainValidator.validate_domain('test@nonwhite.com', whitelisted_domains).should == false
      end

      it 'does not fail validating empty emails' do
        Carto::EmailDomainValidator.validate_domain('', []).should == false
      end
    end
  end
end
