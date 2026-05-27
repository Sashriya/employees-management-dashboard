// client/src/services/socket.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userData) {
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.socket.emit('user-connected', userData);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  onAssignmentCreated(callback) {
    if (this.socket) {
      this.socket.off('assignment-created');
      this.socket.on('assignment-created', callback);
    }
  }

  onAssignmentUpdated(callback) {
    if (this.socket) {
      this.socket.off('assignment-updated');
      this.socket.on('assignment-updated', callback);
    }
  }

  onTaskCompleted(callback) {
    if (this.socket) {
      this.socket.off('task-completed-notification');
      this.socket.on('task-completed-notification', callback);
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.off('notification');
      this.socket.on('notification', callback);
    }
  }

  onStatusUpdated(callback) {
    if (this.socket) {
      this.socket.off('status-updated');
      this.socket.on('status-updated', callback);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new-message');
      this.socket.on('new-message', callback);
    }
  }

  // Emit events
  emitNewAssignment(assignment) {
    if (this.socket) {
      this.socket.emit('new-assignment', assignment);
    }
  }

  emitUpdateAssignmentStatus(data) {
    if (this.socket) {
      this.socket.emit('update-assignment-status', data);
    }
  }

  emitTaskCompleted(data) {
    if (this.socket) {
      this.socket.emit('task-completed', data);
    }
  }

  emitSendMessage(data) {
    if (this.socket) {
      this.socket.emit('send-message', data);
    }
  }
}

export default new SocketService();