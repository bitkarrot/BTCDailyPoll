const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const axios = require('axios')
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const repo_name = '/updategit'
const USER = 'bitkarrot';
const PASS = process.env.PASS
const REPO = 'github.com/bitkarrot' + repo_name;

const dirPath = path.join(__dirname, repo_name);
console.log("directory: ", dirPath)
const git = require('simple-git')();
const remote = `https://${USER}:${PASS}@${REPO}`;

async function BTCDaily() {
    // get btc/usd and btc/hkd daily rate
    let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="

    const today = new Date()
    console.log(today)
        // reverse to DD-MM-YYY
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const newdate = day + "-" + month + "-" + year
    console.log("Date: ", newdate)

    // format is YYYY-MM-DD
    const dbdate = year + "-" + month + "-" + day
    console.log("Date for DB: ", dbdate)
    let full_url = url + newdate
    console.log(full_url)

    console.log("running axios")
    await axios.get(full_url).then(
        async function(response) {
            const data = await response.data;
            // console.log('getting data', data)
            const btcusd = data['market_data']['current_price']['usd']
            const btchkd = data['market_data']['current_price']['hkd']
            const satsrate = 100000000
            const sathkd = parseInt(satsrate / btchkd)
            const usdsat = parseInt(satsrate / btcusd)

            const row = {
                btcusd_rate: parseInt(btcusd),
                date: dbdate,
                usdsat_rate: usdsat,
                sathkd_rate: sathkd,
                btchkd_rate: parseFloat(btchkd).toFixed(2),
            }
            return row
        })
}


// replace this function with BTCDaily()
async function updateFile() {
    console.log("dirPath ", dirPath)
        // check if directory exists
    fs.access(dirPath, (err) => {
        console.log(`Directory ${err ? 'does not exist' : 'exists'}`);
    });

    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        shellJs.touch('./new_file')
        shellJs.cat('./new_file')

        const now_date = "\n" + new Date().toLocaleString()
        const row = BTCDaily()
        console.log("new row: ", row)

        await fs.appendFile('./new_file', now_date, function(err) {
            if (err) {
                console.log("error writing to file",
                    err)
            } else {
                console.log("append to file")
            }
        })
        console.log(shellJs.ls())
        console.log('current directory: ', __dirname);
    } else {
        console.log("Repo does not exist! ")
    }
}

async function initialiseRepo() {
    const res = await git.silent(true)
        .clone(remote)
        .then(() => console.log('finished'))
        .catch((err) => console.error('failed: ', err));
    console.log("initialize result: ", res)
    return true
}

async function gitPushSeq() {
    // Add file for commit and push
    await git.add('.')
        .then(
            (addSuccess) => {
                console.log(addSuccess);
            }, (failedAdd) => {
                console.log('adding files failed');
            });

    const d = new Date().toUTCString()
    const msg = 'Intial commit by simplegit: ' + d

    // Commit files as Initial Commit
    await git.commit(msg)
        .then(
            (successCommit) => {
                console.log(successCommit);
            }, (failed) => {
                console.log('failed commmit');
            });

    // Finally push to online repository
    await git.push('origin', 'master')
        .then((success) => {
            console.log('repo successfully pushed');
        }, (failed) => {
            console.log('repo push failed');
        });

    const status = await git.status();
    console.log("status: ", status)

    const log = await git.log();
    console.log("log: ", log)
}

// start
if (fs.existsSync(dirPath)) {
    shellJs.cd(dirPath);
    console.log("change dir path: ", git.cwd(dirPath))
    git.checkIsRepo()
        .then(isRepo => {
            console.log('isrepo: ', isRepo);
            console.log("status: ", git.status());
        }).then(updateFile())
        .then(gitPushSeq())
} else {
    initialiseRepo().then(
        (success) => {
            console.log("successfullly created repo:", success);
            git.addRemote('origin', remote);
            console.log("change dir path: ", git.cwd(dirPath))

            const status = git.status();
            console.log("status: ", status)
            updateFile();
            gitPushSeq();
        },
        (failed) => {
            console.log('post initialize repo: failed', failed);
        })
}