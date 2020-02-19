require_relative './carto_json_serializer'

module Carto
  class UserNotification < ActiveRecord::Base
    belongs_to :user
    serialize :notifications, ::Carto::CartoJsonSymbolizerSerializer

    validates :user, presence: true
    validate  :only_valid_categories

    VALID_CATEGORIES = [:builder, :dashboard].freeze

    private

    def only_valid_categories
      notifications.keys.none? do |category|
        errors.add(:notifications, "Invalid category: #{category}") unless VALID_CATEGORIES.include?(category)
      end
    end
  end
end
