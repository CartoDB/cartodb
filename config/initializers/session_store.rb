domain = CartoDB.subdomainless_urls? ? nil : Cartodb.config[:session_domain]
CartoDB::Application.config.session_store :cookie_store, key: '_cartodb_session', secure_random: true, domain: domain, expire_after: nil, httponly: true, secure: !(Rails.env.development? || Rails.env.test?)
