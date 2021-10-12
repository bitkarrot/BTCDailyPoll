const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const cron = require('node-cron');

const mySecret = process.env['supabaseKey']
const supabaseURL = 'https://hnmrxumhbwsnuykpllwy.supabase.co'

//console.log(mySecret)
//console.log(supabaseURL)

const supabase = createClient(supabaseURL,mySecret)

//supabase.from('countries').select('*').limit(5).then(console.log).catch(console.error)

// get btc/usd and btc/hkd daily rate
// for date format dd-mm-yyyy
// let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date=10-10-2021"

let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date="

console.log(url)

//cron.schedule('* * * * *', async function() {
    // run task every 24 hours:  0 0 * * *
    const ONE_HOUR = 60 * 60 * 1000;
    const DAILY = ONE_HOUR * 24;
    //console.log('running a task every hour', ONE_HOUR);

    const today = new Date()
    console.log(today)

    const day = today.getDate()
    const month = today.getMonth()+1
    const year = today.getFullYear()
    const newdate = day + "-" + month + "-" + year
    console.log("Date: ", newdate)

    const dbdate = year + "-" + month + "-" + day
    console.log("Date for DB: ", dbdate)

    const static_date = "10-10-2021"
    url  = url + newdate
    console.log(url)

    console.log("running axios")
    // await
    axios.get(url).then(
        function(response) {
            // format is YYYY-MM-DD
            // reverse to DD-MM-YYY
            
            const data = response.data;
            // console.log('getting data', data)
            const btcusd = data['market_data']['current_price']['usd']
            console.log('btcusd', btcusd)

            const btchkd = data['market_data']['current_price']['hkd']
            console.log('btchkd', btchkd)

            const satsrate = 100000000
            const sathkd_rate = satsrate/btchkd
            console.log('satshkd', sathkd_rate)

            const usdsat_rate = satsrate/btcusd
            console.log('usdsat', usdsat_rate)

        }
    )
    //})