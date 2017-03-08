module TrackjsHelper
  def insert_trackjs(app = 'editor')
    if !Cartodb.config[:trackjs].blank? && !Cartodb.config[:trackjs]['customer'].blank?
      customer = Cartodb.config[:trackjs]['customer']
      enabled = Cartodb.config[:trackjs]['enabled']
      app_key = Cartodb.config[:trackjs]['app_keys'][app]

      render(:partial => 'shared/trackjs', :locals => { customer: customer, enabled: enabled, app_key: app_key })
    end
  end
end