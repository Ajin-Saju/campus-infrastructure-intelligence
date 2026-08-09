import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSockets: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSockets: ${client.id}`);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinRoom(client: Socket, userId: string) {
    if (userId) {
      const room = `user:${userId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined WebSocket room: ${room}`);
      client.emit('roomJoined', { room });
    }
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      const room = `user:${userId}`;
      this.server.to(room).emit(event, payload);
      this.logger.log(`Emitted WebSocket event "${event}" to room: ${room}`);
    }
  }

  broadcast(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
      this.logger.log(`Broadcasted WebSocket event "${event}" to all connected clients`);
    }
  }
}
