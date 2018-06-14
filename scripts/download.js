const fs = require('fs');
const fetch = require('node-fetch');

function getExtension() {
  switch(process.platform) {
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    case 'win32':
      return 'windows.exe';
    default:
      throw new Error("unsupported OS")
  }
}

async function download(url, file, callback) {
  const res = await fetch(url);
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(file);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function() {
      callback()
      resolve();
    });
  });}


const extension = getExtension();
const version = require('../package.json').tatara.version;
const file = `bin/tatara-${version}-${extension}`;
const url = `https://github.com/heroku/tatara/releases/download/v${version}/tatara-${version}-${extension}`;

if (!fs.existsSync('bin')) fs.mkdirSync('bin');

if (!fs.existsSync(file)) {
  console.log(`Downloading ${file} from ${url}`)
  download(url, file, () => {
    fs.chmodSync(file, 0o765);
  });
}
