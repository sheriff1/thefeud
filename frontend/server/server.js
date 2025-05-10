const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('A user connected')

  socket.on('game-state-update', (data) => {
    socket.broadcast.emit('game-state-update', data)
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })

  socket.on('update-game', (newState) => {
    socket.broadcast.emit('update-game', newState)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`)
})
