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

  this.parseTickers = (data) => {
    var format = (ticker) => {
      return ticker.trim().length !== 0 && ticker.indexOf(' ') < 0
    }
    return data.split('\n').filter(format)
  }

  this.processTickers = (tickers) => {
    var self = this

    tickers.forEach(ticker => self.getPrice(ticker))
  }

  this.getPrice = (ticker) => {

  }
}

module.exports = Stockfetch
