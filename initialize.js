const { promisify } = require('util');
const { exec } = require('child_process');
const logUpdate = require('log-update');
const cluster = require('cluster');
const cmd = promisify(exec);

exports = module.exports = {};

exports.createSubFiles = async (threads, filePath) => {
  const { stdout } = await cmd(`sed -n '$=' ${filePath}`);
  const nbOfLines = parseInt(stdout);
  const linePerThread = Math.floor(nbOfLines / threads);
  const lineRest = nbOfLines % threads;
  console.log('====== Initializing ======');
  console.log(`${nbOfLines} lines in ${filePath}`);

  const promises = [];
  const subfiles = [];
  for (let i = 0; i < threads; i++) {
    const subfilePath = `${i + 1}.tsv`;
    const start = i === 0 ? i * linePerThread + 2 : i * linePerThread + 1;
    const end = (i + 1) * linePerThread + (i + 1 === threads ? lineRest : 0);
    const string = `sed -n '${start},${end}p` + (end !== nbOfLines ? `;${end + 1}q` : '') + `' ${filePath} > ${subfilePath}`;
    console.log(`Creating subfile ${subfilePath} ...`);
    promises.push(cmd(string));
    subfiles.push({ path: subfilePath, nbOfLines: end + 1 - start });
  }
  await Promise.all(promises);
  console.log('Subfiles created!\n');
  return subfiles;
};

exports.spawnWorkers = function spawnWorkers(threads, subfiles, outputFilePath) {
  console.log('====== Spawning forked processes ======');
  const workersProgression = [];

  const logInter = setInterval(() => {
    logProgression(workersProgression);
  }, 1000);

  let processesEnded = 0;
  for (let i = 0; i < threads; i++) {
    console.log(`Forking process Worker ${i}`);
    const wk = cluster.fork({
      file: subfiles[i].path,
      nbOfLines: subfiles[i].nbOfLines,
      outputFilePath
    });
    workersProgression.push(0);
    wk.on('message', ({ perc }) => {
      workersProgression[i] = perc;
    });
    wk.on('exit', () => {
      logProgression(workersProgression);
      processesEnded++;
      if (processesEnded === threads) {
        clearInterval(logInter);
      }
    });
  }
  console.log('\n====== Working ======');
};

function logProgression(wkProgress) {
  let string = '';
  wkProgress.forEach((wk, i) => {
    string += `Worker ${i} : ${wk || 0}%\n`;
  });
  logUpdate(string);
}
