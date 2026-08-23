from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RideCreate(BaseModel):
    origin: str = Field(min_length=2, max_length=200)
    destination: str = Field(min_length=2, max_length=200)
    departure_time: datetime

    available_seats: int = Field(
        ge=1,
        le=8,
    )

    price_per_seat: float = Field(
        ge=0,
        le=500,
    )


class RideUpdate(BaseModel):
    origin: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    destination: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    departure_time: datetime | None = None

    available_seats: int | None = Field(
        default=None,
        ge=0,
        le=8,
    )

    price_per_seat: float | None = Field(
        default=None,
        ge=0,
        le=500,
    )