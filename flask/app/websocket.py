import eventlet
eventlet.monkey_patch()

import logging
from flask import request

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins=["http://localhost:5173"], async_mode="eventlet")

@socketio.on("connect")
def handle_connect():
    logger.info("Client connected: %s", request.sid)

@socketio.on("disconnect")
def handle_disconnect():
    logger.info("Client disconnected: %s", request.sid)

@socketio.on("connect_error")
def handle_connect_error(e):
    logger.error("Connection error: %s", e)