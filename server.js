// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket signaling server running on ws://localhost:8080');

// Хранилище клиентов: id -> ws
const clients = new Map();

wss.on('connection', (ws) => {
  ws.id = null;

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON', e);
      return;
    }

    const { type, from, to, payload } = data;

    if (type === 'register') {
      // Клиент регистрируется с уникальным id
      ws.id = from;
      clients.set(ws.id, ws);
      console.log(`Client registered with id: ${ws.id}`);
      return;
    }

    if (!ws.id) {
      console.warn('Unregistered client tried to send message');
      return;
    }

    // Пересылаем сообщение клиенту with id = to
    const target = clients.get(to);
    if (target && target.readyState === WebSocket.OPEN) {
      target.send(JSON.stringify({ type, from, payload }));
      console.log(`Forwarded ${type} from ${from} to ${to}`);
    } else {
      console.warn(`Target client ${to} not found or not connected`);
    }
  });

  ws.on('close', () => {
    if (ws.id) {
      clients.delete(ws.id);
      console.log(`Client disconnected: ${ws.id}`);
    }
  });
});
