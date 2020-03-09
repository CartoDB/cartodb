# See http://www.rubydoc.info/gems/net-ldap/0.11
require 'net/ldap'

module Carto
  module Ldap
    class OperationResult

      CODE_UNKNOWN = -1

      def initialize(code = CODE_UNKNOWN, error_message = "", matched_dn = "", message = "")
        @code = code ||
        @error_message = error_message
        @matched_dn = matched_dn
        @message = message
      end

      attr_reader :code, :message, :error_message, :matched_dn

      def to_hash
        {
          code:           code,
          message:        message,
          error_message:  error_message,
          matched_dn:     matched_dn
        }
      end

      def success?
        @code == 0
      end

      def failure?
        !success?
      end
    end
  end
end
