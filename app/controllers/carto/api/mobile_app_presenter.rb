# encoding: utf-8

module Carto
  module Api
    class MobileAppPresenter

      def initialize(mobile_app, current_user, options = {})
        @mobile_app = mobile_app
        @options = options
        @current_user = current_user
      end

      def data(options = {})
        return {} if @mobile_app.nil?
        data = {
          :name       => @mobile_app.name,
          :description => @mobile_app.description,
          :icon_url => @mobile_app.icon_url,
          :platform => @mobile_app.platform,
          :app_id => @mobile_app.app_id,
          :license_key => @mobile_app.license_key,
          :monthly_users => @mobile_app.monthly_users
        }

        if @options[:mobile_platforms].present?
          data[:mobile_platforms] = {
            "android" => {
              text: "Android",
              available: is_platform_available?('android', true),
              selected: is_platform_selected?('android'),
              legend: "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp."
            },
            "ios" => {
              text: "iOS",
              available: is_platform_available?('ios', true),
              selected: is_platform_selected?('ios'),
              legend: "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp."
            },
            "xamarin-android" => {
              text: "Xamarin Android",
              available: is_platform_available?('xamarin-android', @current_user.mobile_xamarin),
              selected: is_platform_selected?('xamarin-android'),
              legend: "Use package from AndroidManifest.xml. E.g: com.example.mycartoapp."
              },
            "xamarin-ios" => {
              text: "Xamarin iOS",
              available: is_platform_available?('xamarin-ios', @current_user.mobile_xamarin),
              selected: is_platform_selected?('xamarin-ios'),
              legend: "Use Bundle identifier. You can find it in the project properties. E.g: com.example.mycartoapp."
              },
            "windows-phone" => {
              text: "Windows Phone",
              available: is_platform_available?('windows-phone', @current_user.mobile_xamarin),
              selected: is_platform_selected?('windows-phone'),
              legend: "Use the Package name from Package.appmanifest. E.g: c882d38a-5c09-4994-87f0-89875cdee539."
            }
          }
        end
      end

      private

      def is_platform_available?(platform, selectable)
        ((@mobile_app.persisted? && @mobile_app.platform != platform) || selectable == false) ? false : true
      end

      def is_platform_selected?(platform)
        (@mobile_app.persisted? && @mobile_app.platform == platform) ? true : false
      end

    end
  end
end