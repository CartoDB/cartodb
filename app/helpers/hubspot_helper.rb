module HubspotHelper
  def insert_hubspot(app = 'editor')
    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank? && params[:cookies] != '0'
      token = CartoDB::Hubspot::instance.token
      event_ids = CartoDB::Hubspot::instance.event_ids

      render(:partial => 'shared/hubspot', :locals => { token: token, event_ids: event_ids })
    end
  end
end
