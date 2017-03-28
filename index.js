const Hapi = require('hapi'),
      mongoskin = require('mongoskin')

const server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 3000
})

const db = mongoskin.db('mongodb://localhost:27017/test', {native_parser: true})
const id = mongoskin.helper.toObjectID

function loadCollection (name, callback) {
  callback(db.collection(name))
}

server.route([
  {
    method: 'GET',
    path: '/',
    handler: function (req, reply) {
      reply('Select a collection, e.g., /collections/messages')
    }
  },
  {
    method: 'GET',
    path: '/collections/{collectionName}',
    handler: function (req, reply) {
      loadCollection(req.params.collectionName, collection => {
        collection.find({}, {
          limit: 10, sort: [['_id', -1]]
        }).toArray((e, results) => {
          if (e) return reply(e)
          reply(results)
        })
      })
    }
  },
  {
    method: 'POST',
    path: '/collections/{collectionName}',
    handler: function (req, reply) {
      loadCollection(req.params.collectionName, collection => {
        collection.insert(req.payload, {}, (e, result) => {
          if (e) return reply(e)
          reply(result.ops)
        })
      })
    }
  },
  {
    method: 'GET',
    path: '/collections/{collectionName}/{id}',
    handler: function (req, reply) {
      loadCollection(req.params.collectionName, collection => {
        collection.findOne({_id: id(req.params.id)}, (e, result) => {
          if (e) return reply(e)
          reply(result)
        })
      })
    }
  },
  {
    method: 'PUT',
    path: '/collections/{collectionName}/{id}',
    handler: function (req, reply) {
      loadCollection(req.params.collectionName, collection => {
        collection.update({
          _id: id(req.params.id)
        }, {
          $set: req.payload
        }, (e, result) => {
          if (e) return reply(e)
          reply(result.result.n === 1 ? {msg: 'success'} : {msg: 'error'})
        })
      })
    }
  },
  {
    method: 'DELETE',
    path: '/collections/{collectionName}/{id}',
    handler: function (req, reply) {
      loadCollection(req.params.collectionName, collection => {
        collection.remove({
          _id: id(req.params.id)
        }, (e, result) => {
          if (e) return reply(e)
          reply(result.result.n === 1 ? {msg: 'success'} : {msg: 'error'})
        })
      })
    }
  }
])

server.start(err => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
