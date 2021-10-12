const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const cron = require('node-cron');

const mySecret = process.env['supabaseKey']
const supabaseURL = 'https://hnmrxumhbwsnuykpllwy.supabase.co'

console.log(mySecret)
console.log(supabaseURL)

const supabase = createClient(supabaseURL,mySecret)

//supabase.from('countries').select('*').limit(5).then(console.log).catch(console.error)

// get btc/usd and btc/hkd daily rate
// for date format dd-mm-yyyy
let url = "https://api.coingecko.com/api/v3/coins/bitcoin/history?localization=false&date=10-10-2021"


console.log(url)

//cron.schedule('* * * * *', async function() {
    // run task every 24 hours:  0 0 * * *
    const ONE_HOUR = 60 * 60 * 1000;
    const DAILY = ONE_HOUR * 24;
    //console.log('running a task every hour', ONE_HOUR);
    console.log("running axios")
    // await
    axios.get(url).then(
        function(response) {
            
            const static_date = "10-10-2021"
            
            // format is YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0]
            const day = 

            console.log(today)
            

            const data = response.data;
//            console.log('getting data', data)
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