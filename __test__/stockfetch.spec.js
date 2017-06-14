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

  it('getPrice should call get on http with valid URL', done => {
    td.replace(stockfetch.http, 'get', url => {
      expect(url).toEqual('http://ichart.finance.yahoo.com/table.csv?s=TSLA')
      done()
      return { on: () => {} }
    })

    stockfetch.getPrice('TSLA')
  })

  it('getPrice should send a response handler to get', done => {
    var ahandler = () => {}

    td.replace(stockfetch.processResponse, 'bind')
    td.when(stockfetch.processResponse.bind(stockfetch, 'TSLA')).thenReturn(ahandler)

    td.replace(stockfetch.http, 'get', (url, handler) => {
      expect(handler).toEqual(ahandler)
      done()
      return { on: () => {} }
    })

    stockfetch.getPrice('TSLA')
  })

  it('getPrice should register handler for failure to reach host', done => {
    var errorHandler = () => {}

    td.replace(stockfetch.processHttpError, 'bind')
    td.when(stockfetch.processHttpError.bind(stockfetch, 'TSLA')).thenReturn(errorHandler)

    var stub = (event, handler) => {
      expect(event).toEqual('error')
      expect(handler).toEqual(errorHandler)
      done()
    }

    td.replace(stockfetch.http, 'get', () => {
      return {
        on: stub
      }
    })

    stockfetch.getPrice('TSLA')
  })

  it('processResponse should call parsePrice with valid data', () => {
    var dataFunction
    var endFunction

    var response = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === 'data') dataFunction = handler
        if (event === 'end') endFunction = handler
      }
    }

    td.replace(stockfetch, 'parsePrice')

    stockfetch.processResponse('TSLA', response)

    dataFunction('some ')
    dataFunction('data')
    endFunction()

    td.verify(stockfetch.parsePrice('TSLA', 'some data'))
  })

  it('processResponse should call processError if response failed', () => {
    var response = { statusCode: 404 }

    td.replace(stockfetch, 'processError')

    stockfetch.processResponse('TSLA', response)

    td.verify(stockfetch.processError('TSLA', 404))
  })

  it('processResponse should call processError only if response failed', () => {
    var response = {
      statusCode: 200,
      on: () => {}
    }

    td.replace(stockfetch, 'processError')

    stockfetch.processResponse('TSLA', response)

    td.verify(stockfetch.processError(), {times: 0})
  })

  it('processHttpError should call processError with error details', () => {
    var error = {code: '...error code...'}
    td.replace(stockfetch, 'processError')

    stockfetch.processHttpError('TSLA', error)

    td.verify(stockfetch.processError('TSLA', '...error code...'))
  })

  var data = 'Date,Open,High,Low,Close,Volume,Adj Close\n 2015-09-11,619.75,625.780029,617.419983,625.77002,1360900,625.77002\n 2015-09-10,613.099976,624.159973,611.429993,621.349976,1900500,621.349976'

  it('parsePrice should update prices', () => {
    stockfetch.parsePrice('TSLA', data)

    expect(stockfetch.prices.TSLA).toEqual('625.77002')
  })

  it('parsePrice should call printReport', () => {
    td.replace(stockfetch, 'printReport')

    stockfetch.parsePrice('TSLA', data)

    td.verify(stockfetch.printReport())
  })

  it('processError should update errors', () => {
    stockfetch.processError('TSLA', 'error')

    expect(stockfetch.errors.TSLA).toEqual('error')
  })

  it('processError should call print report', () => {
    td.replace(stockfetch, 'printReport')

    stockfetch.processError('TSLA', 'error')

    td.verify(stockfetch.printReport())
  })
})
