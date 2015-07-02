CartoDB::Application.config.session_store :cookie_store, :key => '_cartodb_session', 
                                          :domain => Cartodb.config[:session_domain], expire_after: 7.days