# coding: utf-8

module LoginHelper

  DEFAULT_BACKGROUND_COLOR = "#354046"

  def background
    base_color = @organization && @organization.color ? @organization.color : DEFAULT_BACKGROUND_COLOR
    color = "#{darken_color(base_color,0.6)}, #{base_color}"
    "background-image: url(#{image_path('backgrounds/sessions.png')}), linear-gradient(to bottom right, #{color});"
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
    !organization.nil? ? darken_color(organization.color, 0.7) : "#292E33"
  end

  def render_organization_avatar
    if @organization && @organization.name != 'team' && @organization.avatar_url.present?
      avatar_url = @organization.avatar_url.sub(/^https?\:/, '')
      "<picture class=\"Navbar-brand\">
        <img src=\"#{avatar_url}\" alt=\"#{@organization.name}\" height=\"48\" />
      </picture>
      <sup>
        <img src=\"#{image_path("layout/sessions/brand.png")}\" alt=\"CartoDB\" height=\"26\" width=\"26\">
      </sup>".html_safe
    else
      "<picture class=\"Navbar-brand\">
        <source type='image/svg+xml' srcset=\"#{image_path("layout/sessions/brand.png")}\">
        <img src=\"#{image_path("layout/sessions/brand.png")}\" alt='CartoDB' height=\"48\" width=\"48\" />
      </picture>".html_safe
    end
  end

  def forget_password_url
    if CartoDB.account_host
      "#{request.protocol}#{CartoDB.account_host}/password_resets/new"
    end
  end

  def cdb_logout
    logout(CartoDB.extract_subdomain(request))
    logout

    if env['warden']
      env['warden'].logout
      request.session.select { |k, v|
        k.start_with?("warden.user") && !k.end_with?(".session")
      }.each { |k, v|
        env['warden'].logout(value) if warden_proxy.authenticated?(value)
      }
    end
  end
  
end
