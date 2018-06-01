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
const version = process.argv[2];
const file = `bin/tatara-${process.platform}`;
const url = `https://github.com/heroku/tatara/releases/download/v${version}/tatara-${version}-${extension}`;

console.log(`Downloading ${file} from ${url}`)
download(url, file, () => {
  fs.chmodSync(file, 0o765);
});
