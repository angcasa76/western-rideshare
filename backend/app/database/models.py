from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    rides = relationship(
        "Ride",
        back_populates="driver",
        cascade="all, delete-orphan",
    )

    ride_requests = relationship(
        "RideRequest",
        back_populates="passenger",
        cascade="all, delete-orphan",
    )


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)

    driver_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(DateTime, nullable=False)

    available_seats = Column(Integer, nullable=False)
    price_per_seat = Column(Float, nullable=False)

    status = Column(
        String,
        nullable=False,
        default="active",
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    driver = relationship(
        "User",
        back_populates="rides",
    )

    requests = relationship(
        "RideRequest",
        back_populates="ride",
        cascade="all, delete-orphan",
    )


class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(Integer, primary_key=True, index=True)

    ride_id = Column(
        Integer,
        ForeignKey("rides.id"),
        nullable=False,
    )

    passenger_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="pending",
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    ride = relationship(
        "Ride",
        back_populates="requests",
    )

    passenger = relationship(
        "User",
        back_populates="ride_requests",
    )