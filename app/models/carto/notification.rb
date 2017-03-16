# encoding: utf-8

require_dependency 'carto/notifications_markdown_renderer'

module Carto
  class Notification < ActiveRecord::Base
    MAX_BODY_LENGTH = 140

    belongs_to :organization, inverse_of: :notifications
    has_many :received_notifications, inverse_of: :notification

    # TODO: `icon` should be a restricted list of values
    validates :icon, presence: true
    validates :recipients, inclusion: { in: [nil, 'builders', 'viewers', 'all'] }
    validates :recipients, presence: true, if: :organization
    validates :body, presence: true
    validate  :valid_markdown

    after_create :send_to_organization_members

    private

    def send_to_organization_members
      return unless organization
      users = if recipients == 'builders'
                organization.builder_users
              elsif recipients == 'viewers'
                organization.viewer_users
              else
                organization.users
              end
      users.each { |u| received_notifications.create!(user: u, sent_at: created_at) }
    end

    def valid_markdown
      return unless body.present?
      text = Redcarpet::Markdown.new(NotificationsMarkdownRenderer).render(body).strip
      errors.add(:body, "cannot be longer than #{MAX_BODY_LENGTH} characters") if text.length > MAX_BODY_LENGTH
    rescue RuntimeError => e
      errors.add(:body, e.message)
    end
  end
end
