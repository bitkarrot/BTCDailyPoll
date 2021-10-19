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
    await fs.access(dirPath, (err) => { // check if directory exists
        return false
    });

    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        git.cwd(dirPath)
        const row = await BTCDaily()

        if (Object.keys(row).length > 0) {
            const original = await fs.readFileSync("./" + fileToRead, { encoding: 'utf8' })
            let orig = JSON.parse(original)
            orig.push(row)
            const new_content = JSON.stringify(orig)
            await fs.writeFileSync('./' + fileToWrite, new_content);
        }
        await gitPushSeq()
        return true
    } else {
        return false
    }
}

async function gitPushSeq() {
    const d = new Date().toUTCString()
    const msg = 'simplegit: ' + d
    await git.add('.')
    await git.commit(msg)
    await git.push('origin', 'master')
}

// start here
async function main() {
    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        git.checkIsRepo()
        const result = updateFile()
    } else {
        //        const res = await git.silent(true).clone(remote)
        const rest = await git.clone(remote)
        const result = updateFile();
    }
}

const res = main()