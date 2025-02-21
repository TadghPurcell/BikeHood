import eventlet
eventlet.monkey_patch()

from app import create_app
from app.websocket import socketio

if __name__ == "__main__":
    # Create the Flask app instance
    app = create_app()

    # Run the app
    socketio.run(app, host="0.0.0.0", port=8080, debug=app.config["DEBUG"], use_reloader=False)
