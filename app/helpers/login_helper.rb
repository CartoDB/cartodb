# coding: utf-8

module LoginHelper

  def background
    default_color = "#354046"
    color = @organization && @organization.color ?
      "#{darken_color(@organization.color,0.6)},#{@organization.color}" :
      "#{darken_color(default_color,0.6)}, #{default_color}"
    "background: url(#{image_path('backgrounds/sessions.png')}), linear-gradient(to bottom right, #{color});"
  end

  def darken_color(hex_color, amount=0.4)
    hex_color = hex_color.gsub('#','')
    rgb = hex_color.scan(/../).map {|color| color.hex}
    rgb[0] = (rgb[0].to_i * amount).round
    rgb[1] = (rgb[1].to_i * amount).round
    rgb[2] = (rgb[2].to_i * amount).round
    "#%02x%02x%02x" % rgb
  end

  def login_org_avatar
    @organization && @organization.name != "team" && !@organization.avatar_url.blank?
  end

  def forget_password_url
    if CartoDB.account_host
      "#{request.protocol}#{CartoDB.account_host}/password_resets/new"
    end
  end
  
end
