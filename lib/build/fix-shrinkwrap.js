/** Every now and then npm registry returns non-secure URLs.
 * This script rewrites http to https to avoid unneeded differences
 * in npm-shrinkwrap.json
*/

const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../npm-shrinkwrap.json');
const buildPattern = (protocol) => `"resolved": "${protocol}://registry.npmjs`;
const from = new RegExp(buildPattern('http'), 'g');
const to = buildPattern('https');
let replacements = 0;

console.log('> Fixing npm-shrinkwrap.json');
if (!fs.existsSync(file)) {
  console.error(`File ${file} does not exist!`);
  return 1;
}

const content = fs.readFileSync(file, 'utf8');
const matches = content.match(from);
if (matches !== null) {
  replacements = matches.length;
  const modifiedContent = content.replace(from, to);
  fs.writeFileSync(file, modifiedContent, { encoding: 'utf8' });
} 

replacements
  ? console.log(`  Made ${replacements} replacements.`)
  : console.log('  Nothing to replace!');
