const { cpus } = require('os');
const cluster = require('cluster');
const fs = require('fs');
const { createSubFiles, spawnWorkers } = require('./initialize');
const process = require('./process');
const { filePath, outputFilePath } = require('./config');

(async () => {
  const threads = cpus().length;

  if (cluster.isMaster) {
    const subfiles = await createSubFiles(threads, filePath);
    try {
      fs.unlinkSync(outputFilePath);
    } catch {
      console.log(`${outputFilePath} doesnt exist`);
    }
    const tsvHeader = 'name\talternative_names\tosm_type\tosm_id\tclass\ttype\tlon\tlat\tplace_rank\timportance\tstreet\tcity\tcounty\tstate\tcountry\tcountry_code\tdisplay_name\twest\tsouth\teast\tnorth\twikidata\twikipedia\thousenumbers\tpostcode';
    fs.appendFileSync(outputFilePath, tsvHeader);
    spawnWorkers(threads, subfiles, outputFilePath);
  } else {
    process();
  }
})();
