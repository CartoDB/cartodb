# encoding: utf-8

module Carto
  module Api
    class MobileAppPresenter

      def initialize(mobile_app, current_user, fetch_mobile_platforms, fetch_app_types)
        @mobile_app = mobile_app
        @current_user = current_user
        @fetch_mobile_platforms = fetch_mobile_platforms
        @fetch_app_types = fetch_app_types
      end

      def data
        return {} if @mobile_app.nil?
        data = {
          id: @mobile_app.id,
          name: @mobile_app.name,
          description: @mobile_app.description,
          icon_url: @mobile_app.icon_url,
          platform: @mobile_app.platform,
          app_type: @mobile_app.app_type,
          app_id: @mobile_app.app_id,
          license_key: @mobile_app.license_key,
          monthly_users: @mobile_app.monthly_users
        }

        if @fetch_mobile_platforms == true
          data[:mobile_platforms] = {
            "android": {
              text: "Android",
              available: platform_available?('android', true),
              selected: platform_selected?('android'),
              legend: "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp."
            },
            "ios": {
              text: "iOS",
              available: platform_available?('ios', true),
              selected: platform_selected?('ios'),
              legend: "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp."
            },
            "xamarin-android": {
              text: "Xamarin Android",
              available: platform_available?('xamarin-android', @current_user.mobile_xamarin),
              selected: platform_selected?('xamarin-android'),
              legend: "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp."
            },
            "xamarin-ios": {
              text: "Xamarin iOS",
              available: platform_available?('xamarin-ios', @current_user.mobile_xamarin),
              selected: platform_selected?('xamarin-ios'),
              legend: "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp."
            },
            "windows-phone": {
              text: "Windows Phone",
              available: platform_available?('windows-phone', @current_user.mobile_xamarin),
              selected: platform_selected?('windows-phone'),
              legend: "Use the Package name from Package.appmanifest. E.g: c882d38a-5c09-4994-87f0-89875cdee539."
            }
          }
        end

        if @fetch_app_types == true
          data[:app_types] = {
            "open": {
              text: "Limits based on your CartoDB plan. <a href='#'>Learn more</a>.",
              available: app_type_available?('open', @current_user.open_apps_enabled?),
              selected: app_type_selected?('open')
            },
            "dev": {
              text: "Limited to 5 users, unlimited feature-wise. <a href='#'>Learn more</a>.",
              available: app_type_available?('dev', true),
              selected: app_type_selected?('dev')
            },
            "private": {
              text: "Only for enterprise. <a href='#'>Learn more</a>.",
              available: app_type_available?('private', @current_user.private_apps_enabled?),
              selected: app_type_selected?('private')
            }
          }
        end

        data
      end

      private

      def platform_available?(platform, current_platform_enabled)
        (!@mobile_app.persisted? && current_platform_enabled) || platform_selected?(platform)
      end

      def platform_selected?(platform)
        @mobile_app.platform == platform
      end

      def app_type_available?(app_type, current_apps_enabled)
        (!@mobile_app.persisted? && current_apps_enabled) || app_type_selected?(app_type)
      end

      def app_type_selected?(app_type)
        @mobile_app.app_type == app_type
      end
    end
  end
end
