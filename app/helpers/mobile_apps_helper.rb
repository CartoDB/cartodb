# coding: utf-8

APP_PLATFORMS = %w(android ios xamarin-android xamarin-ios windows-phone).freeze
APP_TYPES = %w(dev open private).freeze

module MobileAppsHelper
  def get_mobile_apps_platforms
    {"android"         => { text: "Android", available: true },
     "ios"             => { text: "iOS", available: true  },
     "xamarin-android" => { text: "Xamarin Android", available: current_user.mobile_xamarin },
     "xamarin-ios"     => { text: "Xamarin iOS", available: current_user.mobile_xamarin },
     "windows-phone"   => { text: "Windows Phone", available: current_user.mobile_xamarin }}
  end

  def get_mobile_apps_types
    {"open"    => { text: "Limits based on your CartoDB plan. <a href='#'>Learn more</a>.", available: current_user.open_apps_enabled? },
     "dev"     => { text: "Limited to 5 users, unlimited feature-wise. <a href='#'>Learn more</a>.", available: true },
     "private" => { text: "Only for enterprise. <a href='#'>Learn more</a>.", available: current_user.private_apps_enabled? }}
  end

  def get_app_platform_legends
    {"android":         "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp.",
     "ios":             "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp.",
     "xamarin-android": "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp.",
     "xamarin-ios":     "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp.",
     "windows-phone":   "Use the Package name from Package.appmanifest. E.g: c882d38a-5c09-4994-87f0-89875cdee539."}
  end

  def get_default_mobile_app_icon
    '//cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/avatars/avatar_ghost_red.png'
  end

  def progress_bar_range(used_percentage)
    if used_percentage > 70 && used_percentage < 91
      'is-caution'
    elsif used_percentage > 90
      'is-danger'
    else
      ''
    end
  end
end
