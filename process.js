const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const { mongodb } = require('./config');

exports = module.exports = () => {
  class linesHandler {
    constructor(outputFilePath, db) {
      this.outputFilePath = outputFilePath;
      this.collection = db.collection('cities');
      this.lineHandle = 0;
    }

    newLine(line) {
      const lineArray = line.split('\t');
      const city = lineArray[11];
      if (city) {
        this.collection.findOne({name: city}, {}, (err, res) => {
          this.modifyArrayAndToLine(lineArray, res && res.postcode ? res.postcode : '');
        });
      } else {
        this.modifyArrayAndToLine(lineArray);
      }
    }

    modifyArrayAndToLine(lineArray, postcode = '') {
      if (postcode) {
        const fulltext = lineArray[16];
        const textSplit = fulltext.split(',');
        if (textSplit.length > 4) {
          const start = [lineArray[0]];
          if (postcode) {
            start.push(` ${postcode}`);
          }
          if (lineArray[11]) {
            start.push(` ${lineArray[11]}`);
          }
          const end = [textSplit[textSplit.length - 4], textSplit[textSplit.length - 3], textSplit[textSplit.length - 1]];
          lineArray[16] = start.concat(end).join(',');
        }
      }
      lineArray.push(postcode);
      this.toOSMNameTSV(`\n${lineArray.join('\t')}`);
    }

    toOSMNameTSV(tsvString) {
      fs.appendFile(this.outputFilePath, tsvString, (err) => {
        this.lineHandle++;
      });
    }
  }

  const client = new MongoClient(mongodb, { useUnifiedTopology: true });
  const nbOfLine = parseInt(process.env.nbOfLines);
  let lineRead = 0;

  const percInter = setInterval(() => {
    const perc = Math.floor(lineRead * 100 / nbOfLine);
    process.send({ perc });
  }, 1000);

  client.connect((err) => {
    const db = client.db('villes');
    const lineHandler = new linesHandler(process.env.outputFilePath, db);
    const rl = readline.createInterface({
      input: fs.createReadStream(process.env.file),
      crlfDelay: Infinity,
    });
    rl.on('line',  (line) => {
      lineRead++;
      lineHandler.newLine(line);
    });
    rl.on('close', () => {
      const perc = Math.floor(lineRead * 100 / nbOfLine);
      clearInterval(percInter);
      const endInterval = setInterval(() => {
        if (lineRead === lineHandler.lineHandle) {
          clearInterval(endInterval);
          client.close();
          try {
            fs.unlinkSync(process.env.file);
            console.log(`${process.env.file} deleted`);
          } catch {
            console.log(`${process.env.file} doesnt exist`);
          }
          process.send({ perc });
          process.exit();
        }
      }, 50);
    });
  });
};
