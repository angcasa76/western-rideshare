from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    vehicle_year = Column(
        Integer,
        nullable=True,
    )

    vehicle_make = Column(
        String,
        nullable=True,
    )

    vehicle_model = Column(
        String,
        nullable=True,
    )

    vehicle_color = Column(
        String,
        nullable=True,
    )

    license_plate = Column(
        String,
        nullable=True,
    )

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

    ratings_given = relationship(
        "Rating",
        foreign_keys="Rating.rater_id",
        back_populates="rater",
        cascade="all, delete-orphan",
    )

    ratings_received = relationship(
        "Rating",
        foreign_keys="Rating.rated_user_id",
        back_populates="rated_user",
        cascade="all, delete-orphan",
    )


class Ride(Base):
    __tablename__ = "rides"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    driver_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    origin = Column(
        String,
        nullable=False,
    )

    destination = Column(
        String,
        nullable=False,
    )

    origin_lat = Column(
        Float,
        nullable=True,
    )

    origin_lon = Column(
        Float,
        nullable=True,
    )

    destination_lat = Column(
        Float,
        nullable=True,
    )

    destination_lon = Column(
        Float,
        nullable=True,
    )

    route_geometry = Column(
        JSON,
        nullable=True,
    )

    departure_time = Column(
        DateTime,
        nullable=False,
    )

    distance_km = Column(
        Float,
        nullable=False,
        default=1,
    )

    duration_minutes = Column(
        Float,
        nullable=True,
    )

    available_seats = Column(
        Integer,
        nullable=False,
    )

    total_seats = Column(
        Integer,
        nullable=False,
        default=1,
    )

    price_per_seat = Column(
        Float,
        nullable=False,
    )

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

    started_at = Column(
        DateTime,
        nullable=True,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    cancelled_at = Column(
        DateTime,
        nullable=True,
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

    ratings = relationship(
        "Rating",
        back_populates="ride",
        cascade="all, delete-orphan",
    )


class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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

    pickup_address = Column(
        String,
        nullable=True,
    )

    pickup_lat = Column(
        Float,
        nullable=True,
    )

    pickup_lon = Column(
        Float,
        nullable=True,
    )

    passenger_distance_km = Column(
        Float,
        nullable=True,
    )

    detour_km = Column(
        Float,
        nullable=True,
    )

    quoted_price = Column(
        Float,
        nullable=True,
    )

    route_with_pickup_geometry = Column(
        JSON,
        nullable=True,
    )

    passenger_route_geometry = Column(
        JSON,
        nullable=True,
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


class Rating(Base):
    __tablename__ = "ratings"

    __table_args__ = (
        UniqueConstraint(
            "ride_id",
            "rater_id",
            "rated_user_id",
            name="uq_rating_ride_rater_rated",
        ),
        CheckConstraint(
            "score >= 1 AND score <= 5",
            name="ck_rating_score",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    ride_id = Column(
        Integer,
        ForeignKey("rides.id"),
        nullable=False,
    )

    rater_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    rated_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    score = Column(
        Integer,
        nullable=False,
    )

    comment = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    ride = relationship(
        "Ride",
        back_populates="ratings",
    )

    rater = relationship(
        "User",
        foreign_keys=[rater_id],
        back_populates="ratings_given",
    )

    rated_user = relationship(
        "User",
        foreign_keys=[rated_user_id],
        back_populates="ratings_received",
    )