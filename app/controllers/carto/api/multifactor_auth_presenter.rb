module Carto
  module Api
    class MultifactorAuthPresenter
      def initialize(multifactor_auth)
        @multifactor_auth = multifactor_auth
      end

      def to_poro
        return {} unless @multifactor_auth

        {
          id: @multifactor_auth.id,
          user: @multifactor_auth.user.username,
          type: @multifactor_auth.type,
          enabled: @multifactor_auth.enabled,
          created_at: @multifactor_auth.created_at.to_s,
          updated_at: @multifactor_auth.updated_at.to_s
        }
      end

      def to_poro_with_qrcode
        to_poro.merge(
          qrcode: @multifactor_auth.qr_code
        )
      end
    end
  end
end
