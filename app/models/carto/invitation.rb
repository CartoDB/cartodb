# encoding: utf-8

require 'active_record'
require_dependency 'cartodb/errors'
require_dependency 'carto/user_authenticator'

module Carto
  class Invitation < ActiveRecord::Base
    include Carto::UserAuthenticator

    # Because of an activerecord-postgresql-array bug that makes array
    # insertions unusable we can't set _users_emails mandatory on construction,
    # so we create a creator enforcing desired behaviour.
    # This will be fixed when we upgrade Ruby and Rails
    # validates :users_emails, :welcome_text, presence: true
    validates :inviter_user, :organization, :welcome_text, presence: true
    validates :users_emails, email: true
    validate :users_emails_not_taken

    belongs_to :inviter_user, class_name: Carto::User
    belongs_to :organization

    private_class_method :new

    def self.create_new(inviter_user, users_emails, welcome_text, viewer)
      raise CartoDB::InvalidUser.new("Only admins can create invitations") unless inviter_user.organization_admin?

      # ActiveRecord validation for all values
      invitation = new(inviter_user: inviter_user,
                       organization: inviter_user.organization,
                       users_emails: users_emails,
                       welcome_text: welcome_text,
                       viewer: viewer)
      return invitation unless invitation.valid?

      # Two-step creation workarounding array bug
      invitation = new(inviter_user: inviter_user,
                       organization: inviter_user.organization,
                       welcome_text: welcome_text,
                       viewer: viewer)

      invitation.seed = Carto::UserService.make_token
      if invitation.save
        invitation.reload
        invitation.users_emails = users_emails
        invitation.used_emails = []
        invitation.save

        ::Resque.enqueue(::Resque::OrganizationJobs::Mail::Invitation, invitation.id)
      end
      invitation
    end

    def self.query_with_valid_email(email)
      Carto::Invitation.where('? = ANY(users_emails)', email)
    end

    def self.query_with_unused_email(email)
      query_with_valid_email(email).where('? != ALL(used_emails)', email)
    end

    def token(email)
      secure_digest(email, seed)
    end

    def use(email, token)
      # reload and used_emails assignment is needed because otherwise
      # activerecord-postgresql-array won't update the invitations
      reload
      if users_emails.include?(email) && self.token(email) == token
        if used_emails.include?(email)
          raise AlreadyUsedInvitationError.new("#{email} has already used the invitation")
        else
          self.used_emails = used_emails.push(email)
          save
          true
        end
      else
        false
      end
    end

    private

    def users_emails_not_taken
      return unless users_emails

      users_emails.each do |email|
        errors[:users_emails] << "Existing user for #{email}" if Carto::User.find_by_email(email)
      end
    end

  end
end

class AlreadyUsedInvitationError < StandardError; end
