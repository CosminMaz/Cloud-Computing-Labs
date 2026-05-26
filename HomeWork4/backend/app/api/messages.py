from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlmodel import Session, select, or_, and_
from typing import Dict
import json

from app.core.auth import verify_token, verify_token_raw
from app.core.database import get_session
from app.models.domain import Message, User

router = APIRouter(tags=["messages"])


class ConnectionManager:
    def __init__(self):
        self._connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self._connections[user_id] = ws

    def disconnect(self, user_id: int):
        self._connections.pop(user_id, None)

    async def send_to(self, user_id: int, data: dict):
        ws = self._connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)


manager = ConnectionManager()


@router.websocket("/ws/{user_id}")
async def websocket_chat(
    user_id: int,
    websocket: WebSocket,
    token: str = Query(...),
    session: Session = Depends(get_session),
):
    try:
        payload = verify_token_raw(token)
    except ValueError:
        await websocket.close(code=4001)
        return

    entra_id = payload.get("oid") or payload.get("sub")
    me = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not me or me.id != user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            to_id = int(data.get("to", 0))
            content = (data.get("content") or "").strip()
            if not content or not to_id:
                continue

            msg = Message(sender_id=user_id, receiver_id=to_id, content=content)
            session.add(msg)
            session.commit()
            session.refresh(msg)

            out = {
                "id": msg.id,
                "from_id": user_id,
                "to_id": to_id,
                "content": content,
                "created_at": msg.created_at.isoformat(),
            }
            await manager.send_to(to_id, out)
            await manager.send_to(user_id, out)
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@router.get("/messages/conversations")
def get_conversations(
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    me = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not me:
        raise HTTPException(status_code=404, detail="User not found")

    all_msgs = session.exec(
        select(Message)
        .where(or_(Message.sender_id == me.id, Message.receiver_id == me.id))
        .order_by(Message.created_at.desc())
    ).all()

    conv_map: dict = {}
    for msg in all_msgs:
        other_id = msg.receiver_id if msg.sender_id == me.id else msg.sender_id
        if other_id not in conv_map:
            conv_map[other_id] = {"last_msg": msg, "unread": 0}
        if msg.receiver_id == me.id and not msg.is_read:
            conv_map[other_id]["unread"] += 1

    result = []
    for other_id, data in sorted(conv_map.items(), key=lambda x: x[1]["last_msg"].created_at, reverse=True):
        other_user = session.get(User, other_id)
        result.append({
            "user_id": other_id,
            "display_name": other_user.display_name if other_user else f"User #{other_id}",
            "last_message": data["last_msg"].content[:80],
            "last_message_at": data["last_msg"].created_at.isoformat(),
            "unread_count": data["unread"],
            "is_mine": data["last_msg"].sender_id == me.id,
        })
    return result


@router.post("/messages/{other_user_id}/read")
def mark_read(
    other_user_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    me = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not me:
        raise HTTPException(status_code=404, detail="User not found")

    msgs = session.exec(
        select(Message).where(
            Message.sender_id == other_user_id,
            Message.receiver_id == me.id,
            Message.is_read == False,
        )
    ).all()
    for m in msgs:
        m.is_read = True
    session.commit()
    return {"marked": len(msgs)}


@router.get("/messages/{other_user_id}")
def get_history(
    other_user_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    me = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not me:
        raise HTTPException(status_code=404, detail="User not found")

    msgs = session.exec(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == me.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == me.id),
            )
        )
        .order_by(Message.created_at)
    ).all()

    return [
        {
            "id": m.id,
            "from_id": m.sender_id,
            "to_id": m.receiver_id,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]
