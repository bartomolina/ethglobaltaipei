import asyncio
import websockets
import json
from datetime import datetime

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
    
    print(f"New client connected: {client_id}")
    
    try:
        async for message in websocket:
            # Parse incoming player state
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
    
    except websockets.ConnectionClosed:
        print(f"Client disconnected: {client_id}")
    finally:
        # Remove client on disconnect
        del clients[client_id]
        del game_state[client_id]

async def main():
    print("Starting game server...")
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main()) 