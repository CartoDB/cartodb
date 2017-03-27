# encoding: utf-8

require_dependency 'carto/notifications_markdown_renderer'

module Carto
  class Notification < ActiveRecord::Base
    MAX_BODY_LENGTH = 140

    ICON_WARNING = 'warning'.freeze
    ICON_SUCCESS = 'success'.freeze

    RECIPIENT_ALL = 'all'.freeze
    RECIPIENTS = [RECIPIENT_ALL, 'builders'.freeze, 'viewers'.freeze].freeze

    belongs_to :organization, inverse_of: :notifications
    has_many :received_notifications, inverse_of: :notification

    validates :icon, presence: true, inclusion: { in: [ICON_WARNING, ICON_SUCCESS] }
    validates :recipients, inclusion: { in: [nil] + RECIPIENTS }
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
      users.each { |u| received_notifications.create!(user: u, received_at: created_at) }
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
