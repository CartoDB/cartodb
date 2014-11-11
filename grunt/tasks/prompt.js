
/**
 *  Prompt grunt task for CartoDB.js
 *
 */

var semver = require('semver');

module.exports = {
  task: function(grunt, config) {
    return {

      bump: {
        options: {
          questions: [
            {
              config:  'bump.increment',
              type:    'list',
              message: 'Bump version from ' + '<%= config.pkg.version %>'.cyan + ' to:',
              choices: [
                {
                  value: 'build',
                  name:  'Build:  '.yellow + (config.version.bugfixing + '-?').yellow +
                    ' Unstable, betas, and release candidates.'
                },
                {
                  value: 'patch',
                  name:  'Patch:  '.yellow + semver.inc(config.version.bugfixing, 'patch').yellow +
                    '   Backwards-compatible bug fixes.'
                },
                {
                  value: 'minor',
                  name:  'Minor:  '.yellow + semver.inc(config.version.bugfixing, 'minor').yellow +
                    '   Add functionality in a backwards-compatible manner.'
                },
                {
                  value: 'major',
                  name:  'Major:  '.yellow + semver.inc(config.version.bugfixing, 'major').yellow +
                    '   Incompatible API changes.'
                },
                {
                  value: 'custom',
                  name:  'Custom: ?.?.?'.yellow +
                    '   Specify version...'
                }
              ]
            },
            {
              config:   'bump.version',
              type:     'input',
              message:  'What specific version would you like',
              when:     function (answers) {
                return answers['bump.increment'] === 'custom';
              },
              validate: function (value) {
                var valid = semver.valid(value) && true;
                return valid || 'Must be a valid semver, such as 1.2.3-rc1. See ' +
                  'http://semver.org/'.blue.underline + ' for more details.';
              }
            },
            {
              config:  'bump.files',
              type:    'checkbox',
              default: ['package', 'cartodb', 'readme'],
              message: 'What should get the new version:',
              choices: [
                {
                  value:   'package',
                  name:    'package.json' +
                    (!grunt.file.isFile('package.json') ? ' file not found, will create one'.grey : ''),
                  checked: grunt.file.isFile('package.json')
                },
                {
                  value:   'cartodb',
                  name:    'src/cartodb.js'
                },
                {
                  value:   'readme',
                  name:    'README.md'
                }
              ]
            }
          ],
          then: function(results, done) {
            var bump = grunt.config.get('bump');
            var version = '';

            if (bump.increment !== "custom") {
              switch (bump.increment) {
                case 'build':
                  version = config.version.bugfixing;
                  break;
                default:
                  version = semver.inc(config.version.bugfixing, bump.increment);
              }
              bump.version = version;
            }
            
            grunt.config.set('bump', bump);
            done();
          }
        }

      }

    }
  }
}
