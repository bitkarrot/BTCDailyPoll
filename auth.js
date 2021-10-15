const shellJs = require('shelljs')
const fs = require('fs')
const path = require('path');
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const USER = 'bitkarrot';
const PASS = process.env.PASS
const REPO = 'github.com/bitkarrot/updategit';
// change this repo to satshkd-vercel, 
// append to /public/static/hkd_historical

const dirPath = path.join(__dirname, '/updategit');
console.log("directory: ", dirPath)

const git = require('simple-git')();
const remote = `https://${USER}:${PASS}@${REPO}`;

// replace this function with BTCDaily()
async function makeFile() {
    console.log("dirPath ", dirPath)
        // check if directory exists
    fs.access(dirPath, (err) => {
        console.log(`Directory ${err ? 'does not exist' : 'exists'}`);
    });

    if (fs.existsSync(dirPath)) {
        shellJs.cd(dirPath);
        shellJs.touch('./new_file')
        shellJs.cat('./new_file')

        const now_date = "\n" + new Date().toLocaleString()
        await fs.appendFile('./new_file', now_date, function(err) {
            if (err) {
                console.log("error writing to file",
                    err)
            } else {
                console.log("append to file")
            }
        })
        console.log(shellJs.ls())
        console.log('current directory: ', __dirname);
    } else {
        console.log("Repo does not exist! ")
    }
}

async function initialiseRepo() {
    const res = await git.silent(true)
        .clone(remote)
        .then(() => console.log('finished'))
        .catch((err) => console.error('failed: ', err));
    console.log("initialize result: ", res)
    return true
}


async function gitPushSeq() {
    // Add file for commit and push
    await git.add('.')
        .then(
            (addSuccess) => {
                console.log(addSuccess);
            }, (failedAdd) => {
                console.log('adding files failed');
            });

    const d = new Date().toUTCString()
    const msg = 'Intial commit by simplegit: ' + d

    // Commit files as Initial Commit
    await git.commit(msg)
        .then(
            (successCommit) => {
                console.log(successCommit);
            }, (failed) => {
                console.log('failed commmit');
            });

    // Finally push to online repository
    await git.push('origin', 'master')
        .then((success) => {
            console.log('repo successfully pushed');
        }, (failed) => {
            console.log('repo push failed');
        });


    const status = await git.status();
    console.log("status: ", status)

    const log = await git.log();
    console.log("log: ", log)
}

// start
if (fs.existsSync(dirPath)) {
    shellJs.cd(dirPath);
    console.log("change dir path: ", git.cwd(dirPath))
    git.checkIsRepo()
        .then(isRepo => {
            console.log('isrepo: ', isRepo);
            console.log("status: ", git.status());
        }).then(makeFile())
        .then(gitPushSeq())
} else {
    initialiseRepo().then(
        (success) => {
            console.log("successfullly created repo:", success);
            git.addRemote('origin', remote);
            console.log("change dir path: ", git.cwd(dirPath))

            const status = git.status();
            console.log("status: ", status)
            makeFile();
            gitPushSeq();
        },
        (failed) => {
            console.log('post initialize repo: failed', failed);
        })
}