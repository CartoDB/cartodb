const { resolve } = require('path');

const IGNORED_FILES = [
  'app/assets/stylesheets/old_common/**/*.css.scss',
  'app/assets/stylesheets/table/table_panel/layer-views-panels/filters_panel.css.scss',
  'app/assets/stylesheets/editor-3/codemirror.css.scss',
  'app/assets/stylesheets/editor-3/form-tags.css.scss'
];

const getChangedCSSFiles = () => {
  const str = require('child_process').execSync('(git diff --name-only --relative || true;' +
    'git diff origin/master.. --name-only --relative || true;)' +
    '| grep \'\\.scss\\?$\' || true').toString();

  const files = str.split(/(\r?\n)/g)
    .filter(line => !(line === '\n' || line === '\r' || line.length < 1));

  return files.map(f => resolve(__dirname, f));
};

const getAllCSSFiles = () => {
  const str = require('child_process')
    .execSync('find ./app/assets/stylesheets | grep \'\\.scss\\?$\'')
    .toString();

  const files = str.split(/(\r?\n)/g)
    .filter(line => !(line === '\n' || line === '\r' || line.length < 1));

  return files.map(f => resolve(__dirname, f));
};

const changed = getChangedCSSFiles();
const all = getAllCSSFiles();
const toLint = all.filter((file) => !changed.includes(file));

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-property-sort-order-smacss'
  ],
  ignoreFiles: IGNORED_FILES.concat(toLint),
  rules: {
    'selector-pseudo-element-colon-notation': 'double',
    'color-hex-case': 'upper',
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['extend', 'at-root', 'debug', 'warn', 'error', 'if', 'else', 'for', 'each', 'while', 'mixin', 'include', 'content', 'return', 'function'
      ]}
    ],
    'function-name-case': [ 'lower', {
      ignoreFunctions: ['/^DXImageTransform.Microsoft.*$/']
    }],
    'declaration-empty-line-before': null,
    'block-no-empty': true,
    'shorthand-property-no-redundant-values': true
  }
};
