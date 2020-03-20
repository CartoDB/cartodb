require 'sys_cmd'
require 'base64'
require 'json'

def with_env(vars)
  old = {}
  vars.each do |key, value|
    key = key.to_s
    old[key] = ENV[key]
    ENV[key] = value
  end
  yield
ensure
  vars.each do |key, value|
    key = key.to_s
    ENV[key] = old[key]
  end
end

# TODO: this uses aws cli at the moment.
# if having it installed in the hosts is not convenient we could
# switch to use some aws-sdk-* gem

# Private CA certificate manager for dbdirect
# requirements: openssl, aws cli installed in the system
module Carto::CertificateManager
  module_function

  def generate_certificate(config:, username:, passphrase:, ips:, validity_days:, server_ca:)
    certificates = nil
    arn = nil
    with_env(AWS_ACCESS_KEY_ID: config[:aws_access_key_id], AWS_SECRET_ACCESS_KEY: config[:aws_secret_key]) do
      # Generate secret key
      cmd = SysCmd.command 'openssl genrsa' do
        if passphrase
          option '-passout', 'stdin'
          input passphrase
        end
        argument '2048'
      end
      result = cmd.run direct: true, error_output: :separate
      # TODO: raise if !result || cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?
      key = cmd.output

      # Generate csr
      subj = "/C=US/ST=New York/L=New York/O=CARTO/OU=Customer/CN=#{username}"
      cmd = SysCmd.command 'openssl req' do
        option '-new'
        option '-sha256'
        option '-key', '/dev/stdin'
        if passphrase
          option '-passin', "pass:#{passphrase}"
        end
        input key
        option '-subj', subj
      end
      # TODO: raise if !result || cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?
      csr = cmd.output

      # Encode csr in base64
      csr = Base64.encode64(csr)

      # Issue certificate
      cmd = SysCmd.command 'aws acp-pca issue-certificate' do
        option '--certificate-authority-arn', confg[:ca_arn]
        option '--csr', csr
        option '--signing-algorithm', '"SHA256WITHRSA"'
        option '--validity', %{Value=#{validity_days},Type="DAYS"}
        option '--template-arn', "arn:aws:acm-pca:::template/EndEntityClientAuthCertificate/V1"
      end
      # TODO: raise if !result || cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?
      arn = JSON.parse(cmd.output)['CertificateArn']

      # Get certificate
      cmd = SysCmd.command 'aws acp-pca get-certificate' do
        option '--certificate-arn', arn
        option '--certificate-authority-arn', confg[:ca_arn]
        option '--output', 'text'
      end
      # TODO: raise if !result || cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?

      certificate_chain = cmd.output

      # Remove CA chain
      certificate =

      certificates = {
        client_key: key,
        client_cert: certificate
      }

      if server_ca
        # Get CA chain
        cmd = SysCmd.command 'aws acp-pca get-certificate-authority-certificate' do
          option '--certificate-authority-arn', confg[:ca_arn]
          option '--output', 'text'
        end
        # TODO: raise if !result || cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?
        certificates[:server_ca] = cmd.output
      end
    end
    [certificates, arn]
  end

  def revoke_certificate(config:, arn:)
    # TODO: implement!
  end
end