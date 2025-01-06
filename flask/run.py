from app import create_app

if __name__ == "__main__":
    # Create the Flask app instance
    app = create_app()

    # Run the app
    app.run(host="0.0.0.0", port=8080, debug=app.config["DEBUG"])
