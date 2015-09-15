# encoding: utf-8

module Carto
  class Invitation < ActiveRecord::Base
    # Because of an activerecord-postgresql-array bug that makes array
    # insertions unusable we can't set _users_emails mandatory on construction,
    # so we create a creator enforcing desired behaviour.
    # This will be fixed when we upgrade Ruby and Rails
    # validates :users_emails, :welcome_text, presence: true
    validates :welcome_text, presence: true

    private_class_method :new

    def self.create_new(users_emails, welcome_text)
      invitation = new(welcome_text: welcome_text)
      invitation.save
      invitation.reload
      invitation.users_emails = users_emails
      invitation.save
      invitation
    end

  end
end
