module LoginHelper

  DEFAULT_BACKGROUND_COLOR = "#F9F9F9".freeze

  def background
    base_color = (@organization.present? && @organization.color.present?) ? @organization.color : DEFAULT_BACKGROUND_COLOR
    color = color_to_rgb(base_color)

    "background-image: linear-gradient(0deg, #F9F9F9 70%, rgba(#{color}, 0.4) 100%);"
  end

  def color_to_rgb(hex_color)
    hex_color = hex_color.delete('#')
    rgb = hex_color.scan(/../).map(&:hex)

    "#{rgb[0]}, #{rgb[1]}, #{rgb[2]}"
  end

  def darken_color(hex_color, amount=0.4)
    hex_color = hex_color.gsub('#','')
    rgb = hex_color.scan(/../).map {|color| color.hex}
    rgb[0] = (rgb[0].to_i * amount).round
    rgb[1] = (rgb[1].to_i * amount).round
    rgb[2] = (rgb[2].to_i * amount).round

    "#%02x%02x%02x" % rgb
  end

  def organization_color(organization)
    !organization.nil? ? darken_color(organization.color, 0.4) : "#292E33"
  end

  def render_organization_avatar
    brand_path = image_path("layout/sessions/brand.png")

    if @organization && @organization.name != 'team' && @organization.avatar_url.present?
      avatar_url = @organization.avatar_url.sub(/^https?\:/, '')
      "<picture class=\"Navbar-brand\">
        <img src=\"#{avatar_url}\" alt=\"#{@organization.name}\" height=\"48\" />
      </picture>
      <sup>
        <img src=\"#{brand_path}\" alt=\"CartoDB\" height=\"26\" width=\"26\">
      </sup>".html_safe
    else
      "<picture class=\"Navbar-brand\">
        <source type='image/svg+xml' srcset=\"#{brand_path}\">
        <img src=\"#{brand_path}\" alt='CARTO' height=\"48\" width=\"48\" />
      </picture>".html_safe
    end
  end

  def forget_password_url(organization_name: nil)
    if organization_name
      "#{CartoDB.base_url(organization_name)}/password_resets/new"
    elsif CartoDB.account_host
      "#{request.protocol}#{CartoDB.account_host}/password_resets/new"
    else
      CartoDB.url(self, 'new_password_reset')
    end
  end

  def cdb_logout
    logout(CartoDB.extract_subdomain(request))
    logout

    if env['warden']
      env['warden'].logout
      warden_sessions = request.session.to_hash.select do |k, _|
        k.start_with?("warden.user") && !k.end_with?(".session")
      end
      warden_sessions.each do |_, value|
        env['warden'].logout(value) if warden_proxy.authenticated?(value)
      end
    end
  end

end
