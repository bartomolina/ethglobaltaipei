import asyncio
import websockets
import json
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Store connected clients and their positions/states
clients = {}
game_state = {}

async def handler(websocket):
    # Register new client
    client_id = str(id(websocket))
    clients[client_id] = websocket
    game_state[client_id] = {
        "position": {"x": 0, "y": 3, "z": 0},  # Starting position
        "rotation": {"y": 0},  # Only tracking Y rotation for now
        "face": None,  # Initialize face as None
        "lastUpdate": datetime.now().isoformat()
    }
    
    logger.info(f"New client connected: {client_id}")
    logger.info(f"Total connected clients: {len(clients)}")
    
    try:
        async for message in websocket:
            # Parse incoming player state
            try:
                data = json.loads(message)
                game_state[client_id].update({
                    "position": {
                        "x": data["position"]["x"],
                        "y": data["position"]["y"],
                        "z": data["position"]["z"]
                    },
                    "rotation": {
                        "y": data["rotation"]["y"]
                    },
                    "face": data.get("face"),  # Update face if provided
                    "lastUpdate": datetime.now().isoformat()
                })
                
                # Broadcast to all other clients
                if clients:
                    # Filter out the sender's own state
                    broadcast_state = {
                        k: v for k, v in game_state.items() if k != client_id
                    }
                    # Send only if there are other clients
                    if broadcast_state:
                        state_json = json.dumps(broadcast_state)
                        await websocket.send(state_json)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received from client {client_id}: {e}")
            except Exception as e:
                logger.error(f"Error processing message from client {client_id}: {e}")
    
    except websockets.ConnectionClosed:
        logger.info(f"Client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"Unexpected error with client {client_id}: {e}")
    finally:
        # Remove client on disconnect
        if client_id in clients:
            del clients[client_id]
        if client_id in game_state:
            del game_state[client_id]
        logger.info(f"Cleaned up client {client_id}. Total connected clients: {len(clients)}")

async def main():
    host = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
    port = int(os.getenv("WEBSOCKET_PORT", "8765"))
    
    logger.info(f"Starting game server on {host}:{port}")
    
    try:
        # Run without SSL - Digital Ocean will handle SSL termination
        async with websockets.serve(handler, host, port):
            logger.info("Server is running...")
            await asyncio.Future()  # Run forever
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise 