# encoding: utf-8

module Carto
  module Api
    class InvitationPresenter

      def initialize(invitation)
        @invitation = invitation
      end

      def to_poro
        {
          id: @invitation.id,
          users_emails: @invitation.users_emails,
          welcome_text: @invitation.welcome_text,
          viewer: @invitation.viewer,
          created_at: @invitation.created_at,
          updated_at: @invitation.updated_at
        }
      end

    end
  end
end
