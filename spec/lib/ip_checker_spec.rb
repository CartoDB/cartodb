require 'spec_helper'

describe IpChecker do
  describe "#is_ip?" do
    it "detect IPs" do
      IpChecker.is_ip?('234.111.7.200').should be_true
      IpChecker.is_ip?('1.1.1.1').should be_true
      IpChecker.is_ip?('0.0.0.1').should be_true
      IpChecker.is_ip?('0.0.0.0').should be_true
      IpChecker.is_ip?('127.0.0.1').should be_true
      IpChecker.is_ip?('10.0.0.1').should be_true
      IpChecker.is_ip?('255.255.255.255').should be_true
      IpChecker.is_ip?('2001:db8:3333:4444:5555:6666:7777:8888').should be_true
      IpChecker.is_ip?('2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF').should be_true
      IpChecker.is_ip?('::1234').should be_true
      IpChecker.is_ip?('2001:db8::').should be_true
      IpChecker.is_ip?('::1234:5678').should be_true
      IpChecker.is_ip?('2001:db8::1234:5678').should be_true
      IpChecker.is_ip?('2001:0db8:0001:0000:0000:0ab9:C0A8:0102').should be_true
      IpChecker.is_ip?('2001:db8:1::ab9:C0A8:102').should be_true
      IpChecker.is_ip?('234.111.7.200/28').should be_true
      IpChecker.is_ip?('234.111.7.200/24').should be_true
      IpChecker.is_ip?('234.111.7.200/255.255.255.0').should be_true
    end

    it "rejects non-IPs" do
      IpChecker.is_ip?('234.111.7.256').should be_false
      IpChecker.is_ip?('23').should be_false
      IpChecker.is_ip?('234.111.7').should be_false
      IpChecker.is_ip?('3368601800').should be_false
      IpChecker.is_ip?('2001:db8::12340:5678').should be_false
      IpChecker.is_ip?('20G1:0db8:0001:0000:0000:0ab9:C0A8:0102').should be_false
      IpChecker.is_ip?('ip').should be_false
      IpChecker.is_ip?('ip.ip.ip.ip').should be_false
      IpChecker.is_ip?('ip:ip::').should be_false
    end
  end

  describe "#validate" do
    it "accepts valid IPs" do
      IpChecker.validate('234.111.7.200').should be_nil
      IpChecker.validate('1.1.1.1').should be_nil
      IpChecker.validate('0.0.0.1').should be_nil
      IpChecker.validate('255.255.255.255').should be_nil
    end

    it "accepts valid v6 IPs" do
      IpChecker.validate('2001:db8:3333:4444:5555:6666:7777:8888').should be_nil
      IpChecker.validate('2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF').should be_nil
      IpChecker.validate('::1234').should be_nil
      IpChecker.validate('2001:db8::').should be_nil
      IpChecker.validate('::1234:5678').should be_nil
      IpChecker.validate('2001:db8::1234:5678').should be_nil
      IpChecker.validate('2001:0db8:0001:0000:0000:0ab9:C0A8:0102').should be_nil
      IpChecker.validate('2001:db8:1::ab9:C0A8:102').should be_nil
    end

    it "accepts valid IP ranges" do
      IpChecker.validate('234.111.7.200/28', max_host_bits: 8).should be_nil
      IpChecker.validate('234.111.7.200/24', max_host_bits: 8).should be_nil
      IpChecker.validate('234.111.7.200/255.255.255.0', max_host_bits: 8).should be_nil
    end

    it "accepts valid v6 IP ranges" do
      IpChecker.validate('2001:db8:3333:4444:5555:6666:7777:8888/128').should be_nil
      IpChecker.validate('2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF/64', max_host_bits: 64).should be_nil
      IpChecker.validate('::1234/120', max_host_bits: 8).should be_nil
      IpChecker.validate('2001:db8::/120', max_host_bits: 8).should be_nil
    end

    it "can reject 0 IPs" do
      IpChecker.validate('0.0.0.0', exclude_0: true).should match /not allowed/
      IpChecker.validate('0.0.0.133/24', exclude_0: true, max_host_bits: 8).should match /not allowed/
      IpChecker.validate('::', exclude_0: true).should match /not allowed/
      IpChecker.validate('::0.0.0.0', exclude_0: true).should match /not allowed/
      IpChecker.validate('0:0:0:0:0:0:0:0', exclude_0: true).should match /not allowed/
      IpChecker.validate('0:0:0:0:0:0:2:123/110', exclude_0: true, max_host_bits: 28).should match /not allowed/

      IpChecker.validate('0.0.0.0', exclude_0: false).should be_nil
      IpChecker.validate('0.0.0.133/24', exclude_0: false, max_host_bits: 8).should be_nil
      IpChecker.validate('::', exclude_0: false).should be_nil
      IpChecker.validate('::0.0.0.0', exclude_0: false).should be_nil
      IpChecker.validate('0:0:0:0:0:0:0:0', exclude_0: false).should be_nil
      IpChecker.validate('0:0:0:0:0:0:2:123/110', exclude_0: false, max_host_bits: 28).should be_nil
    end

    it "rejects invalid IPs" do
      IpChecker.validate('234.111.7.256').should match /invalid address/
      IpChecker.validate('23').should match /invalid address/
      IpChecker.validate('234.111.7').should match /invalid address/
      IpChecker.validate('3368601800').should match /invalid address/
      IpChecker.validate('2001:db8::12340:5678').should match /invalid address/
      IpChecker.validate('20G1:0db8:0001:0000:0000:0ab9:C0A8:0102').should match /invalid address/
      IpChecker.validate('ip').should match /invalid address/
      IpChecker.validate('ip.ip.ip.ip').should match /invalid address/
      IpChecker.validate('ip:ip::').should match /invalid address/
    end

    it "can reject too-broad ranges" do
      IpChecker.validate('234.111.7.200/28', max_host_bits: 2).should match /prefix is too short/
      IpChecker.validate('234.111.7.200/23', max_host_bits: 8).should match /prefix is too short/
      IpChecker.validate('234.111.7.200/255.255.255.0', max_host_bits: 7).should match /prefix is too short/

      IpChecker.validate('2001:db8:3333:4444:5555:6666:7777:8888/127', max_host_bits: 0).should match /prefix is too short/
      IpChecker.validate('2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF/63', max_host_bits: 64).should match /prefix is too short/
      IpChecker.validate('::1234/119', max_host_bits: 8).should match /prefix is too short/
      IpChecker.validate('2001:db8::/119', max_host_bits: 8).should match /prefix is too short/
    end

    it "can reject private IPs" do
      # 10.0.0.0/8
      IpChecker.validate('10.0.0.0', exclude_private: true).should match /private address/
      IpChecker.validate('10.3.7.11', exclude_private: true).should match /private address/
      IpChecker.validate('10.255.255.255', exclude_private: true).should match /private address/
      IpChecker.validate('11.0.0.0', exclude_private: true).should be_nil
      IpChecker.validate('9.255.255.255', exclude_private: true).should be_nil
      IpChecker.validate('10.0.0.0', exclude_private: false).should be_nil
      IpChecker.validate('10.3.7.11', exclude_private: false).should be_nil
      IpChecker.validate('10.255.255.255', exclude_private: false).should be_nil

      # 172.16.0.0/12
      IpChecker.validate('172.16.0.0', exclude_private: true).should match /private address/
      IpChecker.validate('172.31.255.255', exclude_private: true).should match /private address/
      IpChecker.validate('172.32.0.0', exclude_private: true).should be_nil
      IpChecker.validate('172.16.0.0', exclude_private: false).should be_nil
      IpChecker.validate('172.31.255.255', exclude_private: false).should be_nil

      # 192.168.0.0/16
      IpChecker.validate('192.168.0.0', exclude_private: true).should match /private address/
      IpChecker.validate('192.168.255.255', exclude_private: true).should match /private address/
      IpChecker.validate('192.169.0.0', exclude_private: true).should be_nil
      IpChecker.validate('192.168.0.0', exclude_private: false).should be_nil
      IpChecker.validate('192.168.255.255', exclude_private: false).should be_nil

      # fc00::/7
      IpChecker.validate('fc00:0:0:0:0:0:0:0', exclude_private: true).should match /private address/
      IpChecker.validate('fc00::', exclude_private: true).should match /private address/
      IpChecker.validate('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', exclude_private: true).should match /private address/
      IpChecker.validate('fe00:0:0:0:0:0:0:0', exclude_private: true).should be_nil
      IpChecker.validate('fe00::', exclude_private: true).should be_nil
      IpChecker.validate('fc00:0:0:0:0:0:0:0', exclude_private: false).should be_nil
      IpChecker.validate('fc00::', exclude_private: false).should be_nil
      IpChecker.validate('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', exclude_private: false).should be_nil
    end

    it "can reject link local IPs" do
      # 169.254.0.0/16
      IpChecker.validate('169.254.255.255', exclude_local: true).should match /link local address/
      IpChecker.validate('169.254.255.255', exclude_local: true).should match /link local address/
      IpChecker.validate('169.255.0.0', exclude_local: true).should be_nil
      IpChecker.validate('169.254.255.255', exclude_local: false).should be_nil
      IpChecker.validate('169.254.255.255', exclude_local: false).should be_nil

      # fe80::/10
      IpChecker.validate('fe80:0:0:0:0:0:0:0', exclude_local: true).should match /link local address/
      IpChecker.validate('fe80::', exclude_local: true).should match /link local address/
      IpChecker.validate('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', exclude_local: true).should match /link local address/
      IpChecker.validate('fec0:0:0:0:0:0:0:0', exclude_local: true).should be_nil
      IpChecker.validate('fec0::', exclude_local: true).should be_nil
      IpChecker.validate('fe80:0:0:0:0:0:0:0', exclude_local: false).should be_nil
      IpChecker.validate('fe80::', exclude_local: false).should be_nil
      IpChecker.validate('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', exclude_local: false).should be_nil
    end

    it "can reject loopback IPs" do
      IpChecker.validate('127.0.0.0', exclude_loopback: true).should match /loopback address/
      IpChecker.validate('127.0.0.1', exclude_loopback: true).should match /loopback address/
      IpChecker.validate('127.255.255.255', exclude_loopback: true).should match /loopback address/
      IpChecker.validate('128.0.0.0', exclude_loopback: true).should be_nil
      IpChecker.validate('::1/128', exclude_loopback: true).should match /loopback address/
      IpChecker.validate('::1', exclude_loopback: true).should match /loopback address/
      IpChecker.validate('0:0:0:0:0:0:0:1', exclude_loopback: true).should match /loopback address/

      IpChecker.validate('127.0.0.0', exclude_loopback: false).should be_nil
      IpChecker.validate('127.0.0.1', exclude_loopback: false).should be_nil
      IpChecker.validate('127.255.255.255', exclude_loopback: false).should be_nil
      IpChecker.validate('::1/128', exclude_loopback: false).should be_nil
      IpChecker.validate('::1', exclude_loopback: false).should be_nil
      IpChecker.validate('0:0:0:0:0:0:0:1', exclude_loopback: false).should be_nil
    end
  end

  describe "#normalize" do
    it "doesn't change single IPs" do
      IpChecker.normalize('234.111.7.200').should eq '234.111.7.200'
      IpChecker.normalize('0.0.0.0').should eq '0.0.0.0'
      IpChecker.normalize('2001:db8:3333:4444:5555:6666:7777:8888').should eq '2001:db8:3333:4444:5555:6666:7777:8888'
    end

    it "removes unnecessary mask/prefix" do
      IpChecker.normalize('234.111.7.200/32').should eq '234.111.7.200'
      IpChecker.normalize('234.111.7.200/255.255.255.255').should eq '234.111.7.200'
      IpChecker.normalize('2001:db8:3333:4444:5555:6666:7777:8888/128').should eq '2001:db8:3333:4444:5555:6666:7777:8888'
    end

    it "zeros out bits outside the range mask" do
      IpChecker.normalize('234.111.7.200/24').should eq '234.111.7.0/24'
      IpChecker.normalize('234.111.7.200/255.255.255.0').should eq '234.111.7.0/24'
      IpChecker.normalize('234.111.7.200/28').should eq '234.111.7.192/28'
      IpChecker.normalize('234.111.7.200/255.255.255.240').should eq '234.111.7.192/28'
      IpChecker.normalize('2001:db8:3333:4444:5555:6666:7777:8888/120').should eq '2001:db8:3333:4444:5555:6666:7777:8800/120'
      IpChecker.normalize('2001:db8:3333:4444:5555:6666:7777:8888/124').should eq '2001:db8:3333:4444:5555:6666:7777:8880/124'
    end
  end
end
