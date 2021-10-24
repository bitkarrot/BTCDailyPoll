simple poll for BTC/USD and BTC/HKD daily price from coingecko

- btcpoll.js - update sathkd-vercel repo hkd_historical (use as cronjob), send email 
- supabase.js - API call, push to supabase with sats equivalent (use as cronjob) - pipedream
- push2file.js - just write to file example 

run cron job on host

`node btcpoll.js >> BTCDailyPoll/logfile 2>&1`
