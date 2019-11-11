class Carto::Api::ReceivedNotificationPresenter
  include Carto::HtmlSafe

  def initialize(received_notification)
    @received_notification = received_notification
  end

  def to_hash
    {
      id: @received_notification.id,
      icon: @received_notification.icon,
      html_body: markdown_html_safe(@received_notification.body),
      received_at: @received_notification.received_at,
      read_at: @received_notification.read_at
    }
  end
end
