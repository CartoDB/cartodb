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
        with_aws_credentials(config) do
          # Generate secret key
          cmd = SysCmd.command 'openssl genrsa' do
            if passphrase.present?
              option '-passout', 'stdin'
              input passphrase
            end
            argument '2048'
          end
          run cmd
          key = cmd.output

          # Generate csr
          subj = "/C=US/ST=New York/L=New York/O=CARTO/OU=Customer/CN=#{username}"
          cmd = SysCmd.command 'openssl req' do
            option '-new'
            option '-sha256'
            option '-key', '/dev/stdin'
            if passphrase.present?
              option '-passin', "pass:#{passphrase}"
            end
            input key
            option '-subj', subj
          end
          run cmd
          csr = cmd.output

          # Encode csr in base64
          csr = Base64.encode64(csr)

          # Issue certificate
          cmd = SysCmd.command 'aws acm-pca issue-certificate' do
            option '--certificate-authority-arn', config['ca_arn']
            option '--csr', csr
            option '--signing-algorithm', 'SHA256WITHRSA'
            option '--validity', %{Value=#{validity_days},Type="DAYS"}
            option '--template-arn', "arn:aws:acm-pca:::template/EndEntityClientAuthCertificate/V1"
          end
          run cmd
          arn = JSON.parse(cmd.output)['CertificateArn']
          puts ">ARN #{arn}" if $DEBUG

          # Get certificate
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

          certificates = {
            client_key: key,
            client_crt: certificate
          }

          if server_ca
            # Get CA chain
            cmd = SysCmd.command 'aws acm-pca get-certificate-authority-certificate' do
              option '--certificate-authority-arn', config['ca_arn']
              option '--output', 'text'
            end
            run cmd
            certificates[:server_ca] = cmd.output
          end
        end
        [certificates, arn]
      end

      def revoke_certificate(config:, arn:, reason: 'UNSPECIFIED')
        serial = serial_from_arn(arn)
        with_aws_credentials(config) do
          cmd = SysCmd.command 'aws acm-pca revoke-certificate' do
            option '--certificate-serial', serial
            option '--certificate-authority-arn', config['ca_arn']
            option '--revocation-reason', reason
          end
          run cmd
          if cmd.status_value != 0
            msg = "Could not revoke certificate"
            msg += ": " + cmd.error_output if cmd.error_output.present?
            raise msg
          end
        end
      end

      private

      class <<self
        private

        def run(cmd)
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
          # TODO: raise if cmd.status_value!= 0 || cmd.error; should we check cmd.error_output?
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
