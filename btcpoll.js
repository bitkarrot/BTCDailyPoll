const debug = require('debug');

const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const axios = require('axios');
require('dotenv').config();

debug.enable('simple-git,simple-git:*');

// simplified version of index.js
// no error checking, use at your own risk. 

const fileToWrite = 'new_hkd_historical' // rename to hkd_historical
const fileToRead = 'hkd_historical' //  filename: hkd_historical
const repo_name = '/updategit' // change to sathkd-vercel

const USER = 'bitkarrot';
const PASS = process.env.GITPASS
const REPO = 'github.com/bitkarrot' + repo_name;
const dirPath = path.join("/tmp", repo_name);

const git = require('simple-git')();
const remote = `https://${USER}:${PASS}@${REPO}`;


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
        return row
    } else {
        return false
    }
}

async function gitPushSeq() {
    git.addConfig('user.email', 'bitkarrot@bitcoin.org.hk');
    git.addConfig('user.name', 'Bitkarrot');

    const d = new Date().toUTCString()
    const msg = 'simplegit: ' + d
    await git.add('.')
    await git.commit(msg)
    await git.push('origin', 'master')
}

// start here
async function main() {
    let result = ''
    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        git.checkIsRepo()
        result = updateFile()
    } else {
        const rest = await git.clone(remote, dirPath)
        result = updateFile();
    }

    // get last git log
    shellJs.cd(dirPath)
    const goto = 'cd ' + dirPath
    let cmd = goto + '; git log -1'
    let lastupdate = shellJs.exec(cmd).stdout
    lastupdate += result
    return lastupdate
}

const res = main()
    // console.log('Result from main() : ', res)


// remove directory 
// console.log('Removing repo : ', dirPath)
// shellJs.rm('-rf', dirPath)