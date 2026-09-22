import os
import importlib
_fastapi = importlib.import_module("fastapi")
APIRouter = _fastapi.APIRouter
HTTPException = _fastapi.HTTPException
BaseModel = importlib.import_module("pydantic").BaseModel
create_access_token = importlib.import_module(
    "app.services.jwt_service"
).create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
ALLOWED_DOMAINS = ("@phuongdong.edu.vn", "@pduni.edu.vn")
ENV = os.getenv("ENV", "development")

class MockMicrosoftLoginRequest(BaseModel):
    email: str
    name: str = ""

@router.post("/microsoft/mock")
def login_with_microsoft_mock(payload: MockMicrosoftLoginRequest):
    if ENV == "production":
        raise HTTPException(status_code=404, detail="Not found")

    email = payload.email.lower()
    if not any(email.endswith(d) for d in ALLOWED_DOMAINS):
        raise HTTPException(status_code=403, detail="Email không thuộc tên miền được cấp phép.")

    role = "teacher" if email.endswith("@phuongdong.edu.vn") else "student"

    # TODO: tìm/tạo user trong DB dựa trên email — giống hệt phần TODO ở endpoint thật
    access_token = create_access_token(subject=email, role=role)

    return {"status": "ok", "access_token": access_token, "email": email, "role": role}

# Endpoint /microsoft (thật, dùng verify_microsoft_id_token) giữ nguyên như bản trước,
# thêm khi Azure app được duyệt.