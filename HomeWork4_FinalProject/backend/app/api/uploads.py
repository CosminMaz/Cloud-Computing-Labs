from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, ContractorProfile, UserRole
from app.schemas.contractor import ContractorProfileRead
from app.services.blob_storage import BlobStorageService, get_blob_service

router = APIRouter(tags=["uploads"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/upload-profile-picture", response_model=ContractorProfileRead)
def upload_profile_picture(
    file: UploadFile = File(...),
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
    blob_service: BlobStorageService = Depends(get_blob_service),
):
    """Streams the uploaded image to Azure Blob Storage and persists the public
    URL on the caller's contractor profile."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type. Allowed: {sorted(ALLOWED_IMAGE_TYPES)}",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 5 MB limit")

    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can upload a profile picture")

    profile = session.exec(select(ContractorProfile).where(ContractorProfile.user_id == user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create your profile before uploading a picture")

    url = blob_service.upload_image(
        stream=file.file,
        content_type=file.content_type,
        original_filename=file.filename or "upload",
    )

    profile.profile_image_url = url
    session.commit()
    session.refresh(profile)
    return profile
