require 'openssl'
require 'json'
require 'securerandom'
require 'sys_cmd'
require 'google/apis/storage_v1'

module Carto
  module Dbdirect
    # Private CA certificate manager for dbdirect
    class CertificateManager
      GCP_AUTH_URL = 'https://www.googleapis.com/auth/cloud-platform'.freeze

      def initialize(config)
        @config = config
      end

      attr_reader :config

      def generate_certificate(username:, passphrase:, validity_days:, server_ca:, pk8:)
        certificates = nil
        arn = nil
        key = openssl_generate_key(passphrase)
        key_pk8 = openssl_converty_key_to_pkcs8(key, passphrase) if pk8
        csr = openssl_generate_csr(username, key, passphrase)
        with_aws_credentials do
          arn = aws_issue_certificate(csr, validity_days)
          certificate = aws_get_certificate(arn)
          certificates = {
            client_key: key,
            client_crt: certificate
          }
          certificates[:server_ca] = get_server_ca if server_ca
          certificates[:client_key_pk8] = key_pk8 if pk8
        end
        [certificates, arn]
      end

      def revoke_certificate(arn:, reason: 'UNSPECIFIED')
        with_aws_credentials do
          aws_revoke_certificate(arn, reason)
        end
      end

      private

      GET_CERTIFICATE_MAX_ATTEMPTS = 8
      GET_CERTIFICATE_DELAY_S = 1

      SIGNING_ALGORITHM = "SHA256WITHRSA".freeze
      TEMPLATE_ARN = "arn:aws:acm-pca:::template/EndEntityClientAuthCertificate/V1".freeze
      VALIDITY_TYPE_DAYS = "DAYS".freeze

      def get_server_ca
        # If not configured, the CA used to sign client certificates will be used (handy for development)
        return aws_get_ca_certificate_chain unless config['server_ca'].present? || config['server_ca'] == 'client_ca'

        # No server_ca file will be generated (it shouldn't be needed) if special value 'disabled' is used
        return if config['server_ca'] == 'disabled'

        # Otherwise the certificate chain should be stored and accessible through a url
        # TODO: cache based on URL (config['server_ca']) with TTL=?
        fetch config['server_ca']
      end

      def openssl_generate_key(passphrase)
        key = OpenSSL::PKey::RSA.new 2048
        if passphrase.present?
          cipher = OpenSSL::Cipher.new 'AES-128-CBC'
          key.export(cipher, passphrase)
        else
          key.to_pem
        end
      end

      def openssl_converty_key_to_pkcs8(key, passphrase)
        cmd = SysCmd.command 'openssl pkcs8' do
          option '-topk8'
          option '-inform', 'PEM'
          option '-passin', "pass:#{passphrase}" if passphrase.present?
          input key
          option '-outform', 'DER'
          option '-passout', "pass:#{passphrase}" if passphrase.present?
          option '-nocrypt' unless passphrase.present?
        end
        run cmd
        cmd.output.force_encoding(Encoding::ASCII_8BIT)
      end

      def openssl_generate_csr(username, key, passphrase)
        subj = OpenSSL::X509::Name.parse("/C=US/ST=New York/L=New York/O=CARTO/OU=Customer/CN=#{username}")
        if passphrase.present?
          key = OpenSSL::PKey::RSA.new key, passphrase
        else
          key = OpenSSL::PKey::RSA.new key
        end
        csr = OpenSSL::X509::Request.new
        csr.version = 0
        csr.subject = subj
        csr.public_key = key.public_key
        csr.sign key, OpenSSL::Digest::SHA256.new
        csr.to_pem
      end

      def aws_acmpca_client
        @aws_acmpca_client ||= Aws::ACMPCA::Client.new
      end

      def aws_issue_certificate(csr, validity_days)
        resp = aws_acmpca_client.issue_certificate(
          certificate_authority_arn: config['ca_arn'],
          csr: csr,
          signing_algorithm: SIGNING_ALGORITHM,
          template_arn: TEMPLATE_ARN,
          validity: {
            value: validity_days,
            type: VALIDITY_TYPE_DAYS
          },
          idempotency_token: SecureRandom.uuid
        )
        resp.certificate_arn
      end

      def aws_get_certificate(arn)
        resp = aws_acmpca_client.wait_until(
          :certificate_issued,
          {
            certificate_authority_arn: config['ca_arn'],
            certificate_arn: arn
          },
          {
            max_attempts: GET_CERTIFICATE_MAX_ATTEMPTS,
            delay: GET_CERTIFICATE_DELAY_S
          }
        )
        resp.certificate
      end

      def aws_get_ca_certificate_chain
        # TODO: we could cache this
        resp = aws_acmpca_client.get_certificate_authority_certificate({
          certificate_authority_arn: config['ca_arn']
        })
        [resp.certificate, resp.certificate_chain].join("\n")
      end

      def aws_revoke_certificate(arn, reason)
        serial = serial_from_arn(arn)
        resp = aws_acmpca_client.revoke_certificate({
          certificate_authority_arn: config['ca_arn'],
          certificate_serial: serial,
          revocation_reason: reason
        })
      end

      def serial_from_arn(arn)
        match = /\/certificate\/(.{32})\Z/.match(arn)
        raise "Invalid arn format #{arn}" unless match
        match[1].scan(/../).join(':')
      end

      def with_aws_credentials(&blk)
        prev_config = Aws.config
        Aws.config = {
          access_key_id: config['aws_access_key_id'],
          secret_access_key: config['aws_secret_key'],
          region: config['aws_region']
        }
        blk.call
      ensure
        Aws.config = prev_config
      end

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

      def run(cmd, error_message: 'Error')
        result = cmd.run direct: true, error_output: :separate
        if cmd.error
          raise cmd.error
        elsif cmd.status_value != 0
          msg = error_message
          msg += ": " + cmd.error_output if cmd.error_output.present?
          raise msg
        end
        result
      end

      def fetch(url)
        match = /\Ags:\/\/([^\/]+)\/(.+)\Z/.match(url)
        if match
          bucket = match[1]
          path = match[2]
          service = Google::Apis::StorageV1::StorageService.new
          service.authorization = Google::Auth.get_application_default([GCP_AUTH_URL])
          service.get_object(bucket, path, download_dest: StringIO.new).string
        else
          open(url) { |io| io.read }
        end
      end
    end
  end
end
