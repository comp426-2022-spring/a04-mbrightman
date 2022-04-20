// run w/ node server.js localhost:5000/app
// OR run the server in one terminal
// use ANOTHER terminal and curl to interact w/ server

const express = require('express');
const app = express();

const logdb = require('./database');

const morgan = require('morgan');
const fs = require('fs');

const args = require('minimist')(process.argv.slice(2))

const port = args.port || process.env.PORT || 5555

const do_debug = args.debug || 'false'

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const server = app.listen(port, () => {
    console.log("App is running on port %PORT%".replace("%PORT%", port))
})



// default endpoint
app.get('/app/', (req,res,next) => {
  res.status(200)
  res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' })
  res.end(res.statusCode + ' ' + res.statusMessage)  
})

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

  const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  next()
})

if (args.log === 'true') {
  const accesslog = fs.createWriteStream('access.log', { flags: 'a'})
  app.use(morgan('combined', { stream: accesslog }))
}

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

if (do_debug === 'true') {
  app.get('/app/log/access', (req, res, next) => {
    try {
      var stmt = logdb.prepare('SELECT * FROM accesslog').all();
      res.status(200).json(stmt)
    } catch (e) {
      console.error(e)
    }
  })
  
  app.get('/app/error', (req, res, next) => {
    throw new Error('Error test successful.')
  })
}

// adding /app/log/access and /app/error for if do_debug is true


app.use(function(req, res, next) {
    // send turns text into html
    // end keeps the text as plaintext
    res.status(404).send("Endpoint does not exist")
    res.type("text/plain")
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