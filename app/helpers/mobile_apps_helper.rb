# coding: utf-8

APP_PLATFORMS = %w(android ios xamarin-android xamarin-ios windows-phone).freeze
APP_TYPES = %w(dev open private).freeze

module MobileAppsHelper

  def get_mobile_apps_platforms
    return [{ name: "android", text: "Android" },
            { name: "ios", text: "iOS" },
            { name: "xamarin-android", text: "Xamarin Android" },
            { name: "xamarin-ios", text: "Xamarin iOS" },
            { name: "windows-phone", text: "Windows Phone" }]
  end

  def get_mobile_apps_types
    return [{ name: "open", text: "Limits based on your CartoDB plan. <a href='#'>Learn more</a>." },
            { name: "dev", text: "Charged, unlimited feature-wise. <a href='#'>Learn more</a>." },
            { name: "private", text: "Only for enterprise. <a href='#'>Learn more</a>." }]
  end

end