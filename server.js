// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket signaling server running on ws://localhost:8080');
//********************************************************************************* */

let clients =[];

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('Client connected');

  ws.on('close', ()=>{
    clients =clients.filter((client)=> client !==ws);
    console.log('Client disconnected');
  });


  //********************************************************
//   // Обработка входящих сообщений
//     ws.on('message', (message) => {
// // Парсим сообщение
//         const data =JSON.parse(message);

// // Отправляем сообщение всем клиентам
//         wss.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN){ // 
//                 client.send(JSON.stringify(data));
//             }
//         });  
  
  //**********************************************************/
  const d={a:'blabla', b:'kuku', c:1974, d:true}
  let m="Hello!!!!!!!!!!!!!"

  const message =JSON.stringify({t1:'myt', d1:d, k1:2028, m:m, e:"Connected"});

  clients.forEach((client) => {
    if(client.readyState === WebSocket.OPEN){
        client.send(message);
    }
  })

})



// // Хранилище клиентов: id -> ws
// const clients = new Map();


// wss.on('connection', (ws) => {
//   ws.id = null;

//   ws.on('message', (message) => {
//     let data;
//     try {
//       data = JSON.parse(message);
//     } catch (e) {
//       console.error('Invalid JSON', e);
//       return;
//     }

//     const { type, from, to, payload } = data;

//     if (type === 'register') {
//       // Клиент регистрируется с уникальным id
//       ws.id = from;
//       clients.set(ws.id, ws);
//       console.log(`Client registered with id: ${ws.id}`);
//       return;
//     }

//     if (!ws.id) {
//       console.warn('Unregistered client tried to send message');
//       return;
//     }

//     // Пересылаем сообщение клиенту with id = to
//     const target = clients.get(to);
//     if (target && target.readyState === WebSocket.OPEN) {
//       target.send(JSON.stringify({ type, from, payload }));
//       console.log(`Forwarded ${type} from ${from} to ${to}`);
//     } else {
//       console.warn(`Target client ${to} not found or not connected`);
//     }
//   });

//   ws.on('close', () => {
//     if (ws.id) {
//       clients.delete(ws.id);
//       console.log(`Client disconnected: ${ws.id}`);
//     }
//   });
// });
