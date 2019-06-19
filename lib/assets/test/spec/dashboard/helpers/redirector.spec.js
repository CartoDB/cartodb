const redirector = require('dashboard/helpers/redirector');

describe('dashboard/helpers/redirector', function () {
  describe('.needsToChangeBaseURL', function () {
    describe('Subdomainful URLs', function () {
      describe('Regular Users', function () {
        it('should return false when username in subdomain is not the same as the logged one', function () {
          const baseURL = 'http://testuser.carto.com';
          const mockedLocation = {
            pathname: '/dashboard',
            origin: 'http://wronguser.carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
        });

        it('should return true when username in subdomain is the same as the logged one', function () {
          const baseURL = 'http://testuser.carto.com';
          const mockedLocation = {
            pathname: '/dashboard',
            origin: 'http://testuser.carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(false);
        });
      });

      describe('Organization Users', function () {
        it('should return true when using a user URL', function () {
          const baseURL = 'http://testorganization.carto.com/u/testuser';
          const mockedLocation = {
            pathname: '/dashboard',
            origin: 'http://testuser.carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
        });

        describe('/u/{username}', function () {
          it('should return false if URL username is not the same as the logged one', function () {
            const baseURL = 'http://testorg.carto.com/u/testuser';
            const mockedLocation = {
              pathname: '/u/wronguser/dashboard',
              origin: 'http://testorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
          });

          it('should return false if organization in URL is not the same as the user one', function () {
            const baseURL = 'http://testorg.carto.com/u/testuser';
            const mockedLocation = {
              pathname: '/u/testuser/dashboard',
              origin: 'http://wrongorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
          });

          it('should return true if URL username and organization is the same as the logged one', function () {
            const baseURL = 'http://testorg.carto.com/u/testuser';
            const mockedLocation = {
              pathname: '/u/testuser/dashboard',
              origin: 'http://testorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(false);
          });
        });

        describe('/user/{username}', function () {
          it('should return false if URL username is not the same as the logged one', function () {
            const baseURL = 'http://testorg.carto.com/user/testuser';
            const mockedLocation = {
              pathname: '/user/wronguser/dashboard',
              origin: 'http://testorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
          });

          it('should return false if organization in URL is not the same as the user one', function () {
            const baseURL = 'http://testorg.carto.com/user/testuser';
            const mockedLocation = {
              pathname: '/user/testuser/dashboard',
              origin: 'http://wrongorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
          });

          it('should return true if URL username and organization is the same as the logged one', function () {
            const baseURL = 'http://testorg.carto.com/user/testuser';
            const mockedLocation = {
              pathname: '/user/testuser/dashboard',
              origin: 'http://testorg.carto.com'
            };

            expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(false);
          });
        });
      });
    });

    describe('Subdomainless URLs', function () {
      describe('/u/{username}', function () {
        it('should return false when username in URL path is not the same as the logged one', function () {
          const baseURL = 'http://carto.com/u/testuser';
          const mockedLocation = {
            pathname: '/u/wronguser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
        });

        it('should return true when username in URL path is the same as the logged one', function () {
          const baseURL = 'http://carto.com/u/testuser';
          const mockedLocation = {
            pathname: '/u/testuser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(false);
        });
      });

      describe('/user/{username}', function () {
        it('should return false when username in URL path is not the same as the logged one', function () {
          const baseURL = 'http://carto.com/user/testuser';
          const mockedLocation = {
            pathname: '/user/wronguser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(true);
        });

        it('should return true when username in URL path is the same as the logged one', function () {
          const baseURL = 'http://carto.com/user/testuser';
          const mockedLocation = {
            pathname: '/user/testuser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.needsToChangeBaseURL(baseURL, mockedLocation)).toBe(false);
        });
      });
    });
  });

  describe('.getBaseUrl', function () {
    describe('Subdomainful URLs', function () {
      describe('Regular Users', function () {
        it('should return http://testuser.carto.com as baseURL', function () {
          const baseURL = 'http://testuser.carto.com';
          const mockedLocation = {
            pathname: '/dashboard',
            origin: 'http://testuser.carto.com'
          };

          expect(redirector.getBaseUrl(mockedLocation)).toBe(baseURL);
        });
      });

      describe('Organization Users', function () {
        it('should return http://testorganization.carto.com/u/testuser as baseURL', function () {
          const baseURL = 'http://testorganization.carto.com/u/testuser';
          const mockedLocation = {
            pathname: '/u/testuser/dashboard',
            origin: 'http://testorganization.carto.com'
          };

          expect(redirector.getBaseUrl(mockedLocation)).toBe(baseURL);
        });
      });
    });

    describe('Subdomainless URLs', function () {
      describe('/u/{username}', function () {
        it('should return http://carto.com/u/testuser as baseURL', function () {
          const baseURL = 'http://carto.com/u/testuser';
          const mockedLocation = {
            pathname: '/u/testuser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.getBaseUrl(mockedLocation)).toBe(baseURL);
        });
      });

      describe('/user/{username}', function () {
        it('should return http://carto.com/user/testuser as baseURL', function () {
          const baseURL = 'http://carto.com/user/testuser';
          const mockedLocation = {
            pathname: '/user/testuser/dashboard',
            origin: 'http://carto.com'
          };

          expect(redirector.getBaseUrl(mockedLocation)).toBe(baseURL);
        });
      });
    });
  });
});
