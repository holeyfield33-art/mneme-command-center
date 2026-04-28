import asyncio
import json
from datetime import datetime, timezone
from typing import Any


class ConnectionManager:
    def __init__(self) -> None:
        self._clients: set[asyncio.Queue[dict[str, Any]]] = set()

    def add_client(self) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._clients.add(queue)
        return queue

    def remove_client(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        self._clients.discard(queue)

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        event = {
            "event": event_type,
            "data": json.dumps(data),
            "id": datetime.now(timezone.utc).isoformat(),
        }
        stale_clients: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in self._clients:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                stale_clients.append(queue)

        for queue in stale_clients:
            self.remove_client(queue)


manager = ConnectionManager()


def broadcast_now(event_type: str, data: dict[str, Any]) -> None:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(manager.broadcast(event_type, data))
        return

    loop.create_task(manager.broadcast(event_type, data))