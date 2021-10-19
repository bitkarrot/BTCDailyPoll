const debug = require('debug');

const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const axios = require('axios')
require('dotenv').config();

debug.enable('simple-git,simple-git:*');

// quick and dirty script to update satshkd repo on daily
// basis via pipedream cron job. email to owner to notify
// no cron jobs allowed on vercel
//
// NOTE: if the target output file in the target repo is the same
// running this update will not affect it. 

const fileToWrite = 'output' // rename to hkd_historical
const fileToRead = 'new_file' //  temp filename: new_hkd_historical
const repo_name = '/updategit' // change to sathkd-vercel

const USER = 'bitkarrot';
const PASS = process.env.GITPASS
    //console.log('PASS TOKEN: ', process.env.GITPASS)

const REPO = 'github.com/bitkarrot' + repo_name;
const dirPath = path.join(__dirname, repo_name);
//console.log("directory: ", dirPath)

const git = require('simple-git')();
const remote = `https://${USER}:${PASS}@${REPO}`;

git.addConfig('user.email', 'bitkarrot@bitcoin.org.hk');
git.addConfig('user.name', 'Bitkarrot');
//git.addRemote('origin', remote);


// get btc/usd and btc/hkd daily rate
async function BTCDaily() {
    let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="

    const today = new Date()
        //    console.log(today)
        // reverse to DD-MM-YYY
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const newdate = day + "-" + month + "-" + year
        // console.log("Date: ", newdate)

    // format is YYYY-MM-DD
    const dbdate = year + "-" + month + "-" + day
        // console.log("Date for DB: ", dbdate)
    let full_url = url + newdate
        // console.log(full_url)

    // console.log("running axios")
    let row = {}

    await axios.get(full_url).then(
            async function(response) {
                const data = await response.data;
                // console.log('getting data', data)
                const btcusd = data['market_data']['current_price']['usd']
                const btchkd = data['market_data']['current_price']['hkd']
                const satsrate = 100000000
                const sathkd = parseInt(satsrate / btchkd)
                const usdsat = parseInt(satsrate / btcusd)

                row = {
                    btcusd_rate: parseInt(btcusd),
                    date: dbdate,
                    usdsat_rate: usdsat,
                    sathkd_rate: sathkd,
                    btchkd_rate: parseFloat(btchkd).toFixed(2),
                }
            })
        //console.log("btc row: ", row)
    return row
}

// update file in the target github repo
async function updateFile() {
    // console.log("dirPath ", dirPath)
    fs.access(dirPath, (err) => { // check if directory exists
        // console.log(`Directory ${err ? 'does not exist' : 'exists'}`);
    });

    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        const row = await BTCDaily()
            // console.log("new row: ", row, "length: ", Object.keys(row).length)

        if (Object.keys(row).length > 0) {
            const original = fs.readFileSync("./" + fileToRead, { encoding: 'utf8' })
            let orig = JSON.parse(original)

            // console.log('new_row string: ', row)
            orig.push(row)
            const new_content = JSON.stringify(orig)

            await fs.writeFileSync('./' + fileToWrite, new_content);
            /*, function(err) {
                if (err) {
                    console.log("error writing to file",
                        err)
                } else {
                    console.log("append to file")
                }
            })
            */
        }
        gitPushSeq()
        return true
    } else {
        // console.log("Repo does not exist! ")
        return false
    }
}

// clone the target github repo
async function initialiseRepo() {
    const bool = false
    const res = await git.silent(true)
        .clone(remote)
        .then(() =>
            // console.log('finished') 
            bool = true)
        .catch((err) =>
            //console.error('failed: ', err)
            bool = false
        );
    // console.log("initialize result: ", res)
    return bool
}

async function gitPushSeq() {
    // Add file for commit and push
    await git.add('.')
        .then(
            (addSuccess) => {
                //  console.log("Add Success: ", addSuccess);
            }, (failedAdd) => {
                //  console.log('adding files failed');
            });

    const d = new Date().toUTCString()
    const msg = 'simplegit: ' + d
        //     console.log("commit message", msg)

    // Commit files as Initial Commit
    await git.commit(msg)
        .then(
            (successCommit) => {
                // console.log("Commit success", successCommit);
            }, (failed) => {
                // console.log('failed commmit');
            });

    // Finally push to online repository
    await git.push('origin', 'master')
        .then((success) => {
            // console.log('repo successfully pushed', success);
        }, (failed) => {
            //  console.log('repo push failed');
        });
}

// start here
// if repo exists, update the daily rates file
// else close the repo and update the daily rates file

if (fs.existsSync(dirPath)) {
    shellJs.cd(dirPath);
    //    console.log("change dir path: ", git.cwd(dirPath))
    git.checkIsRepo()
        .then(isRepo => {
            //console.log('isrepo: ', isRepo);
            //            console.log("status: ", git.status());
        }).then(() => {
            const result = updateFile()
                //            if (result) {
                //                console.log("update file is good: ", result)
                //            } else { console.log(" nothing fetched, don't push") }
        })
} else {
    initialiseRepo().then(
        (success) => {
            //console.log("successfullly created repo:", success);
            //git.addRemote('origin', remote);
            //console.log("change dir path: ", git.cwd(dirPath))
            updateFile();
        },
        (failed) => {
            return false;
            //console.log('post initialize repo: failed', failed);
        })
}