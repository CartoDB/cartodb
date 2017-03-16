# encoding: utf-8

require_dependency 'carto/notifications_markdown_renderer'

module Carto
  class Notification < ActiveRecord::Base
    MAX_BODY_LENGTH = 140

    ICON_WARNING = 'warning'.freeze
    ICON_SUCCESS = 'success'.freeze

    RECIPIENT_ALL = 'all'.freeze
    RECIPIENTS = ['builders'.freeze, 'viewers'.freeze, RECIPIENT_ALL].freeze

    belongs_to :organization, inverse_of: :notifications

    validates :icon, presence: true, inclusion: { in: [ICON_WARNING, ICON_SUCCESS] }
    validates :recipients, inclusion: { in: [nil] + RECIPIENTS }
    validates :recipients, presence: true, if: :organization
    validates :body, presence: true
    validate  :valid_markdown

    private

    def valid_markdown
      return unless body.present?
      text = Redcarpet::Markdown.new(NotificationsMarkdownRenderer).render(body).strip
      errors.add(:body, "cannot be longer than #{MAX_BODY_LENGTH} characters") if text.length > MAX_BODY_LENGTH
    rescue RuntimeError => e
      errors.add(:body, e.message)
    end
  end
end
