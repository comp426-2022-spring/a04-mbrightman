// run w/ node server.js localhost:5000/app
// OR run the server in one terminal
// use ANOTHER terminal and curl to interact w/ server

const express = require('express')
const app = express()

const logdb = require('./database')

const morgan = require('morgan')
const fs = require('fs');

var args = require('minimist')(process.argv.slice(2), {
  int: ['port'],
  boolean: ['log'],
  boolean: ['help'],
  boolean: ['debug']
})

const port = args.port || process.env.PORT || 5555

if (args.help || args.h) {
    console.log(`server.js [options]

    --port		Set the port number for the server to listen on. Must be an integer
                  between 1 and 65535.
  
    --debug	If set to true, creates endlpoints /app/log/access/ which returns
                  a JSON access log from the database and /app/error which throws 
                  an error with the message "Error test successful." Defaults to 
      false.
  
    --log		If set to false, no log files are written. Defaults to true.
      Logs are always written to database.
  
    --help	Return this message and exit.`)

    process.exit(1)
}

const do_logs = !(((args.log === false) && (args.log != null)) || false);
const do_debug = ((args.debug === true) && (args.debug != null)) || false;

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`)
})

/*
    COIN FLIP FUNCTIONS
*/

function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}

function flipACoin(call) {
    var flip = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
    if (flip == call) {
        return {
        'call': call,
        'flip': flip,
        'result': 'win'
        }
    } else {
        return {
        'call': call,
        'flip': flip,
        'result': 'lose'
        }
    }
}

function coinFlips(flips) {
    var a = []
    for (let i = 0; i < flips; i++) {
      a[i] = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
    }
    return a;
}
  
  /** Count multiple flips
   * 
   * Write a function that accepts an array consisting of "heads" or "tails" 
   * (e.g. the results of your `coinFlips()` function) and counts each, returning 
   * an object containing the number of each.
   * 
   * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
   * { tails: 5, heads: 5 }
   * 
   * @param {string[]} array 
   * @returns {{ heads: number, tails: number }}
   */
  
function countFlips(array) {
    var tCounter = 0
    var hCounter = 0
    for (let i = 0; i < array.length; i++) {
      if (array[i] == 'heads') {
        hCounter++
      } else {
        tCounter++
      }
    }
  
    if (tCounter === 0) {
      return {
        'heads': hCounter
      }
    } else if (hCounter === 0) {
      return {
        'tails': tCounter
      }
    } else {
      return {
        'tails': tCounter,
        'heads': hCounter
      }
    }
}

/*
    END FLIP FUNCS
*/

// app.use(logging('common', { stream: accessLog }))
app.use( (req, res, next) => {
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }

  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr.toString(), logdata.remoteuser.toString(), logdata.time.toString(), logdata.method.toString(), logdata.url.toString(), logdata.protocol.toString(), logdata.httpversion, logdata.status, logdata.referer.toString(), logdata.useragent.toString())
  next()
})

if (do_logs === 'true') {
  const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a'})
  app.use(morgan('combined', { stream: WRITESTREAM }))
}

// default endpoint
app.get('/app/', (req,res,next) => {
    const statusCode = 200
    const statusMessage = 'OK'
    res.status(statusCode).end(statusCode + ' ' + statusMessage)
})

// allows you to go to that endpoint and replace :number with something else
app.get('/app/flips/:number', (req, res, next) => {
    flips_array = coinFlips(req.params.number)
    flips_summary = countFlips(flips_array)
    res.status(200).json({ 'raw': flips_array, 'summary': flips_summary })
})

app.get('/app/flip/', (req, res, next) => {
    var flip = coinFlip()
    res.status(200).json({ 'flip': flip })
})

app.get('/app/flip/call/heads/', (req, res, next) => {
    var flip = flipACoin('heads')
    res.status(200).json(flip)
})

app.get('/app/flip/call/tails/', (req, res, next) => {
    var flip = flipACoin('tails')
    res.status(200).json(flip)
})

// adding /app/log/access and /app/error for if do_debug is true
app.get('/app/log/access', (req, res, next) => {
  if (do_debug === true) {
    try{
      var stmt = logdb.prepare('SELECT * FROM accesslog').all();
      res.status(200).json(stmt)
    } catch {
      console.error(e)
    }
    
  } else {
    res.status(404).type('text/plain').send('404 NOT FOUND')
  }
})

app.get('/app/error', (req, res, next) => {
  if (do_debug === true) {
    throw new Error('Error test successful.')
  } else {
    res.status(404).type('text/plain').send('404 NOT FOUND')
  }
})

app.use(function(req, res, next) {
    // send turns text into html
    // end keeps the text as plaintext
    res.status(404).send("Endpoint does not exist")
    res.type("text/plain")
})

// adding comment to push and try again.