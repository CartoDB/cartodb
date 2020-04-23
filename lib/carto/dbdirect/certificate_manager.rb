require 'openssl'
require 'aws-sdk-acmpca'
require 'json'
require 'securerandom'

module Carto
  module Dbdirect
    # Private CA certificate manager for dbdirect
    class CertificateManager
      def initialize(config)
        @config = config
      end

      attr_reader :config

      def generate_certificate(username:, passphrase:, validity_days:, server_ca:)
        certificates = nil
        arn = nil
        key = openssl_generate_key(passphrase)
        csr = openssl_generate_csr(username, key, passphrase)
        with_aws_credentials do
          arn = aws_issue_certificate(csr, validity_days)
          certificate = aws_get_certificate(arn)
          certificates = {
            client_key: key,
            client_crt: certificate
          }
          certificates[:server_ca] = aws_get_ca_certificate_chain if server_ca
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

      def openssl_generate_key(passphrase)
        key = OpenSSL::PKey::RSA.new 2048
        if passphrase.present?
          cipher = OpenSSL::Cipher.new 'AES-128-CBC'
          key.export(cipher, passphrase)
        else
          key.to_pem
        end
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
        with_env(
          AWS_ACCESS_KEY_ID:     config['aws_access_key_id'],
          AWS_SECRET_ACCESS_KEY: config['aws_secret_key'],
          AWS_DEFAULT_REGION:    config['aws_region'],
          &blk
        )
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
    end
  end
end
