module Carto
  class ReceivedNotification < ActiveRecord::Base
    # autosave must be explicitly disabled due to https://github.com/rails/rails/issues/9336
    # but we probably should not autosave from a ternary table anyway
    belongs_to :user, inverse_of: :received_notifications, autosave: false
    belongs_to :notification, inverse_of: :received_notifications, autosave: false
    scope :unread, -> { where(read_at: nil).order('received_at DESC') }

    delegate :icon, :body, to: :notification
  end
end
