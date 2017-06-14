var td = require('testdouble')
var fs = require('fs')
var Stockfetch = require('../src/Stockfetch')

describe('stockfetch tests', function () {
  var stockfetch

  beforeEach(() => {
    stockfetch = new Stockfetch()
  })

  afterEach(() => {
    td.reset()
  })

  it('should pass this canary test', () => {
    test('we should be ready to go', () => {
      expect(true).toBe(true)
    })
  })

  it('read should invoke error handler for invalid file', done => {
    var onError = err => {
      expect(err).toEqual('error reading file: invalidfile')
      done()
    }

    td.replace(fs, 'readFile', (filename, callback) => {
      callback(new Error('failed'))
    })

    stockfetch.readTickers('invalidfile', onError)
  })

  it('read should invoke processTickers for valid file', done => {
    var rawData = 'GOOG\nAAPL\nTSLA\nMSFT'
    var parsedData = ['GOOG', 'AAPL', 'TSLA', 'MSFT']

    td.replace(stockfetch, 'parseTickers')
    td.when(stockfetch.parseTickers(rawData)).thenReturn(parsedData)

    td.replace(stockfetch, 'processTickers', (data) => {
      expect(data).toEqual(parsedData)
      done()
    })

    td.replace(fs, 'readFile', (filename, callback) => {
      callback(null, rawData)
    })

    stockfetch.readTickers('tickers.txt')
  })

  it('read should return error if given file is empty', done => {
    var onError = err => {
      expect(err).toEqual('file tickers.txt has invalid content')
      done()
    }

    td.replace(stockfetch, 'parseTickers')
    td.when(stockfetch.parseTickers('')).thenReturn([])

    td.replace(fs, 'readFile', (filename, callback) => {
      callback(null, '')
    })

    stockfetch.readTickers('tickers.txt', onError)
  })

  it('parseTickers should return tickers', () => {
    expect(stockfetch.parseTickers('a\nb\nc')).toEqual(['a', 'b', 'c'])
  })

  it('parseTickers should return empty array for empty content', () => {
    expect(stockfetch.parseTickers('')).toEqual([])
  })

  it('parseTickers should ignore unexpected format in content', () => {
    var rawData = 'AAPL \nBla h\nGOOG\n\n  '

    expect(stockfetch.parseTickers(rawData)).toEqual(['GOOG'])
  })

  it('processTickers should call getPrice for each ticker symbol', () => {
    td.replace(stockfetch, 'getPrice')

    stockfetch.processTickers(['a', 'b', 'c'])

    td.verify(stockfetch.getPrice('a'))
    td.verify(stockfetch.getPrice('b'))
    td.verify(stockfetch.getPrice('c'))
  })
})
