var fs = require('fs')

var Stockfetch = function () {
  this.readTickers = (filename, onError) => {
    var self = this

    var processResponse = (err, data) => {
      if (err) {
        onError('error reading file: ' + filename)
      } else {
        var tickers = self.parseTickers(data.toString())

        if (tickers.length === 0) {
          onError('file ' + filename + ' has invalid content')
        } else {
          self.processTickers(tickers)
        }
      }
    }

    fs.readFile(filename, processResponse)
  }

  this.parseTickers = () => {

  }

  this.processTickers = () => {

  }
}

module.exports = Stockfetch
