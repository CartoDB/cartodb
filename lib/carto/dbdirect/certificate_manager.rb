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

module Carto
  module Dbdirect

    SEP = '-----END CERTIFICATE-----'.freeze

    # TODO: this uses aws cli at the moment.
    # if having it installed in the hosts is not convenient we could
    # switch to use some aws-sdk-* gem

    # Private CA certificate manager for dbdirect
    # requirements: openssl, aws cli v2 installed in the system
    module CertificateManager
      module_function

      def generate_certificate(config:, username:, passphrase:, ips:, validity_days:, server_ca:)
        certificates = nil
        arn = nil
        key = openssl_generate_key(passphrase)
        csr = openssl_generate_csr(username, key, passphrase)
        with_aws_credentials(config) do
          arn = aws_issue_certificate(config, csr, validity_days)
          puts ">ARN #{arn}" if $DEBUG
          certificate = aws_get_certificate(config, arn)
          certificates = {
            client_key: key,
            client_crt: certificate
          }
          certificates[:server_ca] = aws_get_ca_certificate(config) if server_ca
        end
        [certificates, arn]
      end

      def revoke_certificate(config:, arn:, reason: 'UNSPECIFIED')
        with_aws_credentials(config) do
          aws_revoke_certificate(config, arn, reason)
        end
      end

      private

      class <<self
        private

        def openssl_generate_key(passphrase)
          cmd = SysCmd.command 'openssl genrsa' do
            if passphrase.present?
              option '-passout', 'stdin'
              input passphrase
            end
            argument '2048'
          end
          run cmd
          cmd.output
        end

        def openssl_generate_csr(username, key, passphrase)
          subj = "/C=US/ST=New York/L=New York/O=CARTO/OU=Customer/CN=#{username}"
          cmd = SysCmd.command 'openssl req' do
            option '-new'
            option '-sha256'
            option '-key', '/dev/stdin'
            option '-passin', "pass:#{passphrase}" if passphrase.present?
            input key
            option '-subj', subj
          end
          run cmd
          cmd.output
        end

        def aws_issue_certificate(config, csr, validity_days)
          csr = Base64.encode64(csr)
          cmd = SysCmd.command 'aws acm-pca issue-certificate' do
            option '--certificate-authority-arn', config['ca_arn']
            option '--csr', csr
            option '--signing-algorithm', 'SHA256WITHRSA'
            option '--validity', %{Value=#{validity_days},Type="DAYS"}
            option '--template-arn', "arn:aws:acm-pca:::template/EndEntityClientAuthCertificate/V1"
          end
          run cmd
          JSON.parse(cmd.output)['CertificateArn']
        end

        def aws_get_certificate(config, arn)
          cmd = SysCmd.command 'aws acm-pca get-certificate' do
            option '--certificate-arn', arn
            option '--certificate-authority-arn', config['ca_arn']
            option '--output', 'text'
          end
          run cmd
          certificate_chain = cmd.output
          # Remove CA chain: extract first certificate
          certificate = certificate_chain.split(SEP).first + SEP
          puts ">USER CRT #{certificate}" if $DEBUG
          certificate
        end

        def aws_get_ca_certificate(config)
          # TODO: we could cache this
          cmd = SysCmd.command 'aws acm-pca get-certificate-authority-certificate' do
            option '--certificate-authority-arn', config['ca_arn']
            option '--output', 'text'
          end
          run cmd
          cmd.output
        end

        def aws_revoke_certificate(config, arn, reason)
          serial = serial_from_arn(arn)
          cmd = SysCmd.command 'aws acm-pca revoke-certificate' do
            option '--certificate-serial', serial
            option '--certificate-authority-arn', config['ca_arn']
            option '--revocation-reason', reason
          end
          run cmd, error_message: "Could not revoke certificate"
        end

        def run(cmd, error_message: 'Error')
          puts ">RUNNING #{cmd}" if $DEBUG
          result = cmd.run direct: true, error_output: :separate
          if $DEBUG
            puts "  result: #{result.inspect}"
            puts "  status: #{cmd.status}"
            puts "  error: #{cmd.error}" if cmd.error.present?
            if cmd.error_output.present?
              puts "  STDERR:"
              puts cmd.error_output
            end
            puts "  OUTPUT:"
            puts cmd.output
          end
          if cmd.error
            raise cmd.error
          elsif cmd.status_value != 0
            msg = error_message
            msg += ": " + cmd.error_output if cmd.error_output.present?
            raise msg
          end
          result
        end

        def serial_from_arn(arn)
          match = /\/certificate\/(.{32})\Z/.match(arn)
          raise "Invalid arn format #{arn}" unless match
          match[1].scan(/../).join(':')
        end

        def with_aws_credentials(config, &blk)
          with_env(
            AWS_ACCESS_KEY_ID:     config['aws_access_key_id'],
            AWS_SECRET_ACCESS_KEY: config['aws_secret_key'],
            AWS_DEFAULT_REGION:    config['aws_region'],
            &blk
          )
        end
      end
    end
  end
end
