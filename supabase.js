//const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const path = require('path');

//const mySecret = process.env['supabaseKey']
//const supabaseURL = 'https://hnmrxumhbwsnuykpllwy.supabase.co'
//const supabase = createClient(supabaseURL, mySecret)

// get btc/usd and btc/hkd daily rate
let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="
    //console.log(url)

async function insertBTCrate(daydata) {
    const { result, error } = await supabase
        .from('BTCHistorical')
        .insert([
            daydata
        ])
        //  console.log('result:', result, 'error: ', error)
    return result
}

/*     // get yesterday 
const date = new Date()
date.setDate(date.getDate() - 1);
const today = date
*/


async function BTCDaily() {
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

    // const static_date = "12-10-2021"
    // const dbdate = "2021-10-12"
    let full_url = url + newdate
    console.log(full_url)

    console.log("running axios")
    await axios.get(full_url).then(
            async function(response) {

                const data = await response.data;
                console.log('getting data', data)
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

                console.log("new row: ", row)

                //                await insertBTCrate(row).then((data) => {
                //                    console.log(data)
                //                })
            })
        // reset url to blank before next cronjob
    full_url = ""
    console.log(" reset url ", full_url)
}

const result = BTCDaily()