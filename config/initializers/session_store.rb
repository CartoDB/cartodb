CartoDB::Application.config.session_store :cookie_store, key: '_cartodb_session', secure_random: true,
                                          domain: Cartodb.config[:session_domain], expire_after: 7.days,
                                          httponly: true, secure: !(Rails.env.development? || Rails.env.test?)