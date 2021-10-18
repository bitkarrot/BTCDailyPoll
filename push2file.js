const axios = require('axios')
const shellJs = require('shelljs')
const path = require('path');
const fs = require('fs')

// get btc/usd and btc/hkd daily rate update a file with new entry

let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="
    //console.log(url)

const fileName = "historical_new"
const dirPath = path.join(__dirname, fileName);

async function insertBTCrate(daydata) {
    console.log("inserting data: ", daydata)
    if (!fs.existsSync(dirPath)) { shellJs.touch(dirPath) }

    await fs.appendFile(dirPath, JSON.stringify(daydata), function(err) {
        if (err) {
            console.log("error writing to file",
                err)
        } else {
            console.log("append to file")
        }
    })
    return true
}

async function BTCDaily() {
    const today = new Date()
    console.log(today)

    // reverse to DD-MM-YYY
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const newdate = day + "-" + month + "-" + year
    console.log("Date: ", newdate)

    // default date format is YYYY-MM-DD
    const dbdate = year + "-" + month + "-" + day
    console.log("Date for DB: ", dbdate)

    // const static_date = "12-10-2021"
    // const dbdate = "2021-10-12"
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
                const sathkd = satsrate / btchkd
                const usdsat = satsrate / btcusd

                const row = {
                    date: dbdate,
                    btcusd_rate: btcusd,
                    btchkd_rate: btchkd,
                    usdsat_rate: usdsat,
                    sathkd_rate: sathkd
                }

                console.log("new row: ", row)

                await insertBTCrate(row).then((data) => {
                    console.log(data)
                })
            })
        // reset url to blank before next cronjob
    full_url = ""
    console.log(" reset url ", full_url)
}

const result = BTCDaily()