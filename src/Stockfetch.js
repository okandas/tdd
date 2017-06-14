var fs = require('fs')
var http = require('http')

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
    var self = this
    var url = 'http://ichart.finance.yahoo.com/table.csv?s=' + ticker
    self.http.get(url, self.processResponse.bind(self, ticker))
            .on('error', self.processHttpError.bind(self, ticker))
  }

  this.http = http

  this.processResponse = (ticker, response) => {
    var self = this
    if (response.statusCode === 200) {
      var data = ''
      response.on('data', chunk => { data += chunk })
      response.on('end', () => {
        self.parsePrice(ticker, data)
      })
    } else {
      self.processError(ticker, response.statusCode)
    }
  }

  this.processHttpError = (ticker, error) => {
    var self = this
    self.processError(ticker, error.code)
  }

  this.parsePrice = (ticker, data) => {
    var self = this
    var price = data.split('\n')[1].split(',').pop()
    self.prices[ticker] = price
    self.printReport()
  }

  this.printReport = () => {

  }

  this.processError = (ticker, error) => {
    var self = this
    self.errors[ticker] = error
    this.printReport()
  }

  this.prices = {}
  this.errors = {}

  this.reportCallback = () => {

  }
}

module.exports = Stockfetch
