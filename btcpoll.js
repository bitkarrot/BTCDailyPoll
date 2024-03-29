const debug = require('debug');
const moment = require('moment');
//const emailform = require("./emailform");

const cron = require('node-cron');
const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const axios = require('axios');
require('dotenv').config();

//debug.enable('simple-git,simple-git:*');
// simplified version of index.js
// no error checking, use at your own risk. 

const fileToWrite = "public/hkd_historical"
const fileToRead = "public/hkd_historical"
    //const repo_name = '/updategit' // change to sathkd-vercel
const repo_name = '/satshkd-vercel'

const USER = 'bitkarrot';
const PASS = process.env.GITPASS
console.log('PASS TOKEN: ', process.env.GITPASS)

const REPO = 'github.com/bitkarrot' + repo_name;
const dirPath = path.join(__dirname, repo_name);

console.log("dirPath: ", dirPath)

const git = require('simple-git')();
const remote = `https://${USER}:${PASS}@${REPO}`;

console.log('Remote:', remote)

const email = process.env.EMAIL
const username = process.env.USERNAME
git.addConfig('user.email', email);
git.addConfig('user.name', username);


// get btc/usd and btc/hkd daily rate
async function BTCDaily() {
    let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="

    const yesterday = moment().subtract(1, 'days') // YYYY-MM-DD
    const reverse = yesterday.format('DD-MM-YYYY')

    // format is YYYY-MM-DD
    const dbdate = yesterday.format('YYYY-MM-DD')
    let full_url = url + reverse
    let row = {}
    console.log("db date: ", dbdate)
    console.log("new date format:  ", reverse, "\n")

    await axios.get(full_url).then(
        async function(response) {
            console.log("full url: ", full_url)
            const data = await response.data;
            //console.log("axios data: ", data)
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
            console.log("row data: ", row)
        })
    return row
}

// update file in the target github repo
async function updateFile() {
    // console.log(shellJs.ls())
    //   shellJs.cd(dirPath);
    git.cwd(dirPath)
    const row = await BTCDaily()

    if (Object.keys(row).length > 0) {
        console.log("dirpath", dirPath)
        console.log("direname", __dirname)

        const original = await fs.readFileSync(fileToRead)
        let orig = JSON.parse(original)
        console.log(orig[0])
        orig.push(row)
        console.log(orig[orig.length - 1])
        const new_content = JSON.stringify(orig)

        await fs.writeFileSync(fileToWrite, new_content);
        await gitPushSeq()
    }
}

async function gitPushSeq() {
    // Add file for commit and push
    git.cwd(dirPath)
    console.log("status: ", git.status());

    await git.add('public/hkd_historical')
        .then(
            (addSuccess) => {
                console.log("Add Success: ", addSuccess);
            }, (failedAdd) => {
                console.log('adding files failed');
            });


    const d = new Date().toUTCString()
    const msg = 'simplegit: ' + d
    console.log("commit message", msg)

    // Commit files as Initial Commit
    await git.commit(msg)
        .then(
            (successCommit) => {
                console.log("Commit success: ", successCommit);
            }, (failed) => {
                console.log('failed commmit');
            });

    // Finally push to online repository
    await git.push('origin', 'main') // make sure correct branch!
        .then((success) => {
            console.log('repo successfully pushed', success);
            //const subject = "btc rate to sathkd-vercel: " + new Date().toUTCString()
            //emailform.sendEmailData(subject, "simplegit Repo successfully pushed: " + JSON.stringify(success))
        }, (failed) => {
            console.log('repo push failed', failed);
        });
}


// start here
async function main() {
    /*
    if (new Date().getHours() !== 0) {
        console.log(`Current hours is ${new Date().getHours()}, not running.`)
        process.exit(0);
    }
    */
    console.log("starting btcpoll script for satshkd ")
    let result = ''
    if (fs.existsSync(dirPath)) {
        console.log("check if file exists", dirPath)
        shellJs.cd(dirPath);
        console.log(shellJs.ls())
        const status = await git.checkIsRepo()
        console.log("is repo? ", status)
        result = updateFile()
    } else {
        const rest = await git.clone(remote, dirPath)
        console.log("is repo cloned? ", rest)
        shellJs.cd(dirPath);
        console.log(shellJs.ls())
        result = updateFile();
    }
}

//cron.schedule('0 0 * * *', async function() { //At 00:00.” 
const res = main()
console.log('Result from main() : ', res)
    //})


// remove directory 
// console.log('Removing repo : ', dirPath)
// shellJs.rm('-rf', dirPath)
