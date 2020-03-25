require 'spec_helper_min'
require 'support/helpers'
require 'carto/dbdirect/certificate_manager'

module TestCertificateManager
  module_function

  @crl = []

  def generate_certificate(config:, username:, passphrase:, validity_days:, server_ca:)
    [
      {
        client_key: mocked('key', username, passphrase),
        client_crt: mocked('crt', username, validity_days, config),
        server_ca: server_ca ? mocked('crt', config) : nil
      },
      mocked('arn', username, validity_days, config)
    ]
  end

  def revoke_certificate(config:, arn:, reason: 'UNSPECIFIED')
    @crl << mocked('crt', arn, rason, config)
  end

  def _crl
    @crl
  end

  class <<self
    private
    def mocked(name, *args)
      "#{name} for #{args.join('_')}"
    end
  end
end

describe Carto::Api::Public::DbdirectCertificatesController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    host! "#{@user1.username}.localhost.lan"
  end

  describe '#create' do
    before(:each) do
      @params = { api_key: @user1.api_key }
      Carto::DbdirectCertificate.stubs(:certificate_manager).returns(TestCertificateManager)
      @config = {
        certificates: {
          ca_arn: "the-ca-arn",
          maximum_validity_days: 300,
          aws_access_key_id: 'the_aws_key',
          aws_secret_key: 'the_aws_secret',
          aws_region: 'the_aws_region'
        }
      }.with_indifferent_access
    end

    after(:each) do
      Carto::DbdirectCertificate.delete_all
    end

    it 'needs authentication for certificate creation' do
      params = {
        name: 'cert_name'
      }
      post_json api_v4_dbdirect_certificates_create_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'creates certificates without password ips or validity' do
      params = {
        name: 'cert_name',
        api_key: @user1.api_key
      }
      Cartodb.with_config dbdirect: @config do
        post_json api_v4_dbdirect_certificates_create_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:client_crt]).to eq %{crt for user00000001_300_#{@config['certificates']}}
          expect(response.body[:client_key]).to eq %{key for user00000001_}
          expect(response.body[:server_ca]).to be_nil
          expect(response.body[:name]).to eq 'cert_name'
          cert_id = response.body[:id]
          expect(cert_id).not_to be_empty
          cert = Carto::DbdirectCertificate.find(cert_id)
          expect(cert.user.id).to eq @user1.id
          expect(cert.name).to eq 'cert_name'
          expect(cert.arn).to eq %{arn for user00000001_300_#{@config['certificates']}}
        end
      end
    end

    it 'names certificates after the user if no name is provided' do
      params = {
        api_key: @user1.api_key
      }
      Cartodb.with_config dbdirect: @config do
        post_json api_v4_dbdirect_certificates_create_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:client_crt]).to eq %{crt for user00000001_300_#{@config['certificates']}}
          expect(response.body[:client_key]).to eq %{key for user00000001_}
          expect(response.body[:server_ca]).to be_nil
          expect(response.body[:name]).to eq @user1.username
          cert_id = response.body[:id]
          expect(cert_id).not_to be_empty
          cert = Carto::DbdirectCertificate.find(cert_id)
          expect(cert.user.id).to eq @user1.id
          expect(cert.name).to eq @user1.username
        end
      end
    end

    it 'avoids certificate name clashes adding a suffix' do
      params = {
        name: 'cert_name',
        api_key: @user1.api_key
      }
      Cartodb.with_config dbdirect: @config do
        post_json api_v4_dbdirect_certificates_create_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:name]).to eq 'cert_name'
          cert_id = response.body[:id]
          cert = Carto::DbdirectCertificate.find(cert_id)
          expect(cert.user.id).to eq @user1.id
          expect(cert.name).to eq 'cert_name'
        end
        post_json api_v4_dbdirect_certificates_create_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:name]).to eq 'cert_name_1'
          cert_id = response.body[:id]
          cert = Carto::DbdirectCertificate.find(cert_id)
          expect(cert.user.id).to eq @user1.id
          expect(cert.name).to eq 'cert_name_1'
        end
        post_json api_v4_dbdirect_certificates_create_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:name]).to eq 'cert_name_2'
          cert_id = response.body[:id]
          cert = Carto::DbdirectCertificate.find(cert_id)
          expect(cert.user.id).to eq @user1.id
          expect(cert.name).to eq 'cert_name_2'
        end
      end
    end
  end
end
