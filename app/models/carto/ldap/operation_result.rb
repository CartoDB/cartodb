# encoding: UTF-8

module Carto
  module Ldap
    class OperationResult

      CODE_UNKNOWN = -1

      def initialize(code, error_message, matched_dn, message)
        @code = code
        @error_message = error_message
        @matched_dn = matched_dn
        @message = message
      end

      def code
        @code || CODE_UNKNOWN
      end

      def message
        @message || ""
      end

      def error_message
        @error_message || ""
      end

      def matched_dn
        @matched_dn || ""
      end

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
