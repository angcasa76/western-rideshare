import os
from datetime import date, datetime, time, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import models
from app.database.database import Base, engine, get_db
from app.schemas import RideCreate, RideUpdate, UserCreate, UserLogin


# ---------------------------------------------------------
# SETUP
# ---------------------------------------------------------

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Western Rideshare API",
    version="1.0.0",
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def create_access_token(user_id: int):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    db_user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return db_user


def serialize_driver(driver):
    return {
        "id": driver.id,
        "name": driver.name,
    }


def serialize_passenger(passenger):
    return {
        "id": passenger.id,
        "name": passenger.name,
        "email": passenger.email,
    }


def serialize_ride(ride):
    return {
        "id": ride.id,
        "origin": ride.origin,
        "destination": ride.destination,
        "departure_time": ride.departure_time,
        "available_seats": ride.available_seats,
        "price_per_seat": ride.price_per_seat,
        "status": ride.status,
        "driver": serialize_driver(ride.driver),
    }


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Western Rideshare API",
        "status": "running",
    }


# ---------------------------------------------------------
# USERS
# ---------------------------------------------------------

@app.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    email = user.email.lower().strip()

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    hashed_password = pwd_context.hash(user.password)

    new_user = models.User(
        name=user.name.strip(),
        email=email,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
        },
    }


@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    email = user.email.lower().strip()

    db_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    password_is_correct = pwd_context.verify(
        user.password,
        db_user.hashed_password,
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(db_user.id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
        },
    }


@app.get("/me")
def get_me(
    current_user: models.User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


# ---------------------------------------------------------
# CREATE RIDE
# ---------------------------------------------------------

@app.post("/rides")
def create_ride(
    ride: RideCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if ride.departure_time <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="Departure time must be in the future",
        )

    new_ride = models.Ride(
        driver_id=current_user.id,
        origin=ride.origin.strip(),
        destination=ride.destination.strip(),
        departure_time=ride.departure_time,
        available_seats=ride.available_seats,
        price_per_seat=ride.price_per_seat,
        status="active",
    )

    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)

    return {
        "message": "Ride created successfully",
        "ride": serialize_ride(new_ride),
    }


# ---------------------------------------------------------
# GET / SEARCH RIDES
# ---------------------------------------------------------

@app.get("/rides")
def get_rides(
    origin: str | None = Query(default=None),
    destination: str | None = Query(default=None),
    ride_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Ride)

    query = query.filter(
        models.Ride.status == "active",
        models.Ride.available_seats > 0,
    )

    if origin:
        query = query.filter(
            models.Ride.origin.ilike(
                f"%{origin.strip()}%"
            )
        )

    if destination:
        query = query.filter(
            models.Ride.destination.ilike(
                f"%{destination.strip()}%"
            )
        )

    if ride_date:
        start_datetime = datetime.combine(
            ride_date,
            time.min,
        )

        end_datetime = datetime.combine(
            ride_date,
            time.max,
        )

        query = query.filter(
            models.Ride.departure_time >= start_datetime,
            models.Ride.departure_time <= end_datetime,
        )

    rides = (
        query
        .order_by(models.Ride.departure_time.asc())
        .all()
    )

    return [serialize_ride(ride) for ride in rides]


# ---------------------------------------------------------
# GET ONE RIDE
# ---------------------------------------------------------

@app.get("/rides/{ride_id}")
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db),
):
    ride = (
        db.query(models.Ride)
        .filter(models.Ride.id == ride_id)
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found",
        )

    return serialize_ride(ride)


# ---------------------------------------------------------
# DRIVER'S RIDES
# ---------------------------------------------------------

@app.get("/my-rides")
def get_my_rides(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rides = (
        db.query(models.Ride)
        .filter(
            models.Ride.driver_id == current_user.id
        )
        .order_by(models.Ride.departure_time.asc())
        .all()
    )

    return [serialize_ride(ride) for ride in rides]


# ---------------------------------------------------------
# UPDATE RIDE
# ---------------------------------------------------------

@app.patch("/rides/{ride_id}")
def update_ride(
    ride_id: int,
    ride_update: RideUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = (
        db.query(models.Ride)
        .filter(models.Ride.id == ride_id)
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found",
        )

    if ride.driver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the driver of this ride",
        )

    if ride.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Only active rides can be edited",
        )

    update_data = ride_update.model_dump(
        exclude_unset=True
    )

    if "origin" in update_data:
        update_data["origin"] = (
            update_data["origin"].strip()
        )

    if "destination" in update_data:
        update_data["destination"] = (
            update_data["destination"].strip()
        )

    if "departure_time" in update_data:
        if update_data["departure_time"] <= datetime.now():
            raise HTTPException(
                status_code=400,
                detail="Departure time must be in the future",
            )

    for field, value in update_data.items():
        setattr(ride, field, value)

    db.commit()
    db.refresh(ride)

    return {
        "message": "Ride updated successfully",
        "ride": serialize_ride(ride),
    }


# ---------------------------------------------------------
# CANCEL RIDE
# ---------------------------------------------------------

@app.delete("/rides/{ride_id}")
def cancel_ride(
    ride_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = (
        db.query(models.Ride)
        .filter(models.Ride.id == ride_id)
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found",
        )

    if ride.driver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the driver of this ride",
        )

    if ride.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Ride is already cancelled",
        )

    ride.status = "cancelled"

    for ride_request in ride.requests:
        if ride_request.status == "pending":
            ride_request.status = "cancelled"

        elif ride_request.status == "accepted":
            ride_request.status = "cancelled"

    db.commit()

    return {
        "message": "Ride cancelled successfully",
        "ride_id": ride.id,
        "status": ride.status,
    }


# ---------------------------------------------------------
# REQUEST A RIDE
# ---------------------------------------------------------

@app.post("/rides/{ride_id}/request")
def request_ride(
    ride_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = (
        db.query(models.Ride)
        .filter(models.Ride.id == ride_id)
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found",
        )

    if ride.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This ride is not active",
        )

    if ride.driver_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot request your own ride",
        )

    if ride.available_seats <= 0:
        raise HTTPException(
            status_code=400,
            detail="This ride has no available seats",
        )

    existing_request = (
        db.query(models.RideRequest)
        .filter(
            models.RideRequest.ride_id == ride_id,
            models.RideRequest.passenger_id
            == current_user.id,
        )
        .first()
    )

    if existing_request:
        raise HTTPException(
            status_code=400,
            detail="You have already requested this ride",
        )

    new_request = models.RideRequest(
        ride_id=ride.id,
        passenger_id=current_user.id,
        status="pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Ride request sent",
        "request": {
            "id": new_request.id,
            "ride_id": new_request.ride_id,
            "passenger_id": new_request.passenger_id,
            "status": new_request.status,
        },
    }


# ---------------------------------------------------------
# PASSENGER REQUEST HISTORY
# ---------------------------------------------------------

@app.get("/my-requests")
def get_my_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(models.RideRequest)
        .filter(
            models.RideRequest.passenger_id
            == current_user.id
        )
        .order_by(models.RideRequest.id.desc())
        .all()
    )

    results = []

    for ride_request in requests:
        results.append(
            {
                "request_id": ride_request.id,
                "status": ride_request.status,
                "ride": serialize_ride(
                    ride_request.ride
                ),
            }
        )

    return results


# ---------------------------------------------------------
# CANCEL PASSENGER REQUEST
# ---------------------------------------------------------

@app.delete("/requests/{request_id}")
def cancel_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride_request = (
        db.query(models.RideRequest)
        .filter(
            models.RideRequest.id == request_id
        )
        .first()
    )

    if not ride_request:
        raise HTTPException(
            status_code=404,
            detail="Ride request not found",
        )

    if (
        ride_request.passenger_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="This is not your ride request",
        )

    if ride_request.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Request is already cancelled",
        )

    if ride_request.status == "declined":
        raise HTTPException(
            status_code=400,
            detail="A declined request cannot be cancelled",
        )

    if ride_request.status == "accepted":
        ride_request.ride.available_seats += 1

    ride_request.status = "cancelled"

    db.commit()
    db.refresh(ride_request)

    return {
        "message": "Ride request cancelled",
        "request_id": ride_request.id,
        "status": ride_request.status,
    }


# ---------------------------------------------------------
# DRIVER REQUESTS
# ---------------------------------------------------------

@app.get("/driver/requests")
def get_driver_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(models.RideRequest)
        .join(models.Ride)
        .filter(
            models.Ride.driver_id
            == current_user.id
        )
        .order_by(models.RideRequest.id.desc())
        .all()
    )

    results = []

    for ride_request in requests:
        results.append(
            {
                "request_id": ride_request.id,
                "status": ride_request.status,
                "passenger": serialize_passenger(
                    ride_request.passenger
                ),
                "ride": serialize_ride(
                    ride_request.ride
                ),
            }
        )

    return results


# ---------------------------------------------------------
# ACCEPT REQUEST
# ---------------------------------------------------------

@app.post("/requests/{request_id}/accept")
def accept_ride_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride_request = (
        db.query(models.RideRequest)
        .filter(
            models.RideRequest.id == request_id
        )
        .first()
    )

    if not ride_request:
        raise HTTPException(
            status_code=404,
            detail="Ride request not found",
        )

    ride = ride_request.ride

    if ride.driver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the driver of this ride",
        )

    if ride.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This ride is not active",
        )

    if ride_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This request has already been processed",
        )

    if ride.available_seats <= 0:
        raise HTTPException(
            status_code=400,
            detail="No available seats remain",
        )

    ride_request.status = "accepted"
    ride.available_seats -= 1

    db.commit()
    db.refresh(ride_request)
    db.refresh(ride)

    return {
        "message": "Ride request accepted",
        "request_id": ride_request.id,
        "status": ride_request.status,
        "remaining_seats": ride.available_seats,
    }


# ---------------------------------------------------------
# DECLINE REQUEST
# ---------------------------------------------------------

@app.post("/requests/{request_id}/decline")
def decline_ride_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride_request = (
        db.query(models.RideRequest)
        .filter(
            models.RideRequest.id == request_id
        )
        .first()
    )

    if not ride_request:
        raise HTTPException(
            status_code=404,
            detail="Ride request not found",
        )

    ride = ride_request.ride

    if ride.driver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the driver of this ride",
        )

    if ride_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This request has already been processed",
        )

    ride_request.status = "declined"

    db.commit()
    db.refresh(ride_request)

    return {
        "message": "Ride request declined",
        "request_id": ride_request.id,
        "status": ride_request.status,
    }