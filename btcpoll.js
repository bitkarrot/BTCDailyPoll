const debug = require('debug');

const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const axios = require('axios');
require('dotenv').config();

//debug.enable('simple-git,simple-git:*');

// simplified version of index.js
// no error checking, use at your own risk. 

const fileToWrite = "public/new_hkd_historical"
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

git.addConfig('user.email', 'bitkarrot@bitcoin.org.hk');
git.addConfig('user.name', 'Bitkarrot');


// get btc/usd and btc/hkd daily rate
async function BTCDaily() {
    let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="

    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const newdate = day + "-" + month + "-" + year

    // format is YYYY-MM-DD
    const dbdate = year + "-" + month + "-" + day
    let full_url = url + newdate
    let row = {}

    await axios.get(full_url).then(
        async function(response) {
            const data = await response.data;
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
    return row
}

// update file in the target github repo
async function updateFile() {
    console.log(shellJs.ls())
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

    await git.add('public/new_hkd_historical')
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
                console.log("Commit success", successCommit);
            }, (failed) => {
                console.log('failed commmit');
            });

    // Finally push to online repository
    await git.push('origin', 'main') // make sure correct branch!
        .then((success) => {
            console.log('repo successfully pushed', success);
        }, (failed) => {
            console.log('repo push failed', failed);
        });
}


// start here
async function main() {
    let result = ''
        /*    if (fs.existsSync(dirPath)) {
                console.log("check if file exists", dirPath)
                shellJs.cd(dirPath);
                console.log(shellJs.ls())
                const status = await git.checkIsRepo()
                console.log("is repo? ", status)
                result = updateFile()
            } else {
                */
    const rest = await git.clone(remote, dirPath)
    console.log("is repo cloned? ", rest)
    shellJs.cd(dirPath);
    console.log(shellJs.ls())
    result = updateFile();
    // }
}

const res = main()
    // console.log('Result from main() : ', res)


// remove directory 
// console.log('Removing repo : ', dirPath)
// shellJs.rm('-rf', dirPath)