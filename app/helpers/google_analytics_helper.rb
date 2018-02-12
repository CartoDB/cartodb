module GoogleAnalyticsHelper
  def insert_google_analytics(track, public_view = false, custom_vars = {})
    if !Cartodb.config[:google_analytics].blank? && !Cartodb.config[:google_analytics][track].blank? &&
       !Cartodb.config[:google_analytics]["domain"].blank? && params[:cookies] != '0'
      ua = Cartodb.config[:google_analytics][track]
      domain = Cartodb.config[:google_analytics]["domain"]

      render(:partial => 'shared/analytics', :locals => { ua: ua, domain: domain, custom_vars: custom_vars, public_view: public_view })
    end
  end
end
