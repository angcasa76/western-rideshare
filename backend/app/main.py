import math
import os
import time as time_module

from datetime import (
    date,
    datetime,
    time,
    timedelta,
    timezone,
)

import httpx

from dotenv import load_dotenv

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from jose import (
    JWTError,
    jwt,
)

from passlib.context import (
    CryptContext,
)

from sqlalchemy import (
    func,
    text,
)

from sqlalchemy.exc import (
    IntegrityError,
)

from sqlalchemy.orm import (
    Session,
)

from app.database import models

from app.database.database import (
    Base,
    engine,
    get_db,
)

from app.schemas import (
    RatingCreate,
    RideCreate,
    RideRequestCreate,
    RoutePreviewRequest,
    UserCreate,
    UserLogin,
    UserProfileUpdate,
)


load_dotenv()

Base.metadata.create_all(
    bind=engine
)


def run_schema_migrations():
    statements = [
        (
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS "
            "vehicle_year INTEGER"
        ),
        (
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS "
            "vehicle_make VARCHAR"
        ),
        (
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS "
            "vehicle_model VARCHAR"
        ),
        (
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS "
            "vehicle_color VARCHAR"
        ),
        (
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS "
            "license_plate VARCHAR"
        ),
        (
            "ALTER TABLE rides "
            "ADD COLUMN IF NOT EXISTS "
            "total_seats INTEGER"
        ),
        (
            "ALTER TABLE rides "
            "ADD COLUMN IF NOT EXISTS "
            "started_at TIMESTAMP"
        ),
        (
            "ALTER TABLE rides "
            "ADD COLUMN IF NOT EXISTS "
            "completed_at TIMESTAMP"
        ),
        (
            "ALTER TABLE rides "
            "ADD COLUMN IF NOT EXISTS "
            "cancelled_at TIMESTAMP"
        ),
        (
            "UPDATE rides "
            "SET total_seats = available_seats "
            "WHERE total_seats IS NULL"
        ),
        (
            "ALTER TABLE rides "
            "ALTER COLUMN total_seats "
            "SET DEFAULT 1"
        ),
    ]

    try:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(
                    text(statement)
                )

    except Exception as error:
        print(
            "Schema migration warning:",
            error,
        )


run_schema_migrations()


app = FastAPI(
    title="Western Rideshare API",
    version="3.0.0",
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

security = HTTPBearer()


SECRET_KEY = os.getenv(
    "SECRET_KEY"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is not set"
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------
# PRICING
# -------------------------------------------

BASE_RIDE_PRICE = 3.50

PRICE_PER_KM = 0.28

MINIMUM_RIDE_PRICE = 6.00

MAXIMUM_RIDE_PRICE = 40.00


def calculate_ride_price(
    distance_km: float,
):

    price = (
        BASE_RIDE_PRICE
        + distance_km
        * PRICE_PER_KM
    )

    price = max(
        price,
        MINIMUM_RIDE_PRICE,
    )

    price = min(
        price,
        MAXIMUM_RIDE_PRICE,
    )

    return round(
        price,
        2,
    )


# -------------------------------------------
# WESTERN SERVICE AREA
# -------------------------------------------

WESTERN_LAT = 43.0096

WESTERN_LON = -81.2737

SERVICE_RADIUS_KM = 30.0


def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
):

    earth_radius_km = (
        6371.0088
    )

    lat1_radians = (
        math.radians(
            lat1
        )
    )

    lat2_radians = (
        math.radians(
            lat2
        )
    )

    delta_lat = (
        math.radians(
            lat2 - lat1
        )
    )

    delta_lon = (
        math.radians(
            lon2 - lon1
        )
    )

    value = (
        math.sin(
            delta_lat / 2
        )
        ** 2
        + math.cos(
            lat1_radians
        )
        * math.cos(
            lat2_radians
        )
        * math.sin(
            delta_lon / 2
        )
        ** 2
    )

    return (
        earth_radius_km
        * 2
        * math.atan2(
            math.sqrt(value),
            math.sqrt(
                1 - value
            ),
        )
    )


def distance_from_western(
    lat: float,
    lon: float,
):

    return haversine_km(
        WESTERN_LAT,
        WESTERN_LON,
        lat,
        lon,
    )


def enforce_service_area(
    location: dict,
    label: str = "Location",
):

    distance = (
        distance_from_western(
            location["lat"],
            location["lon"],
        )
    )

    if (
        distance
        > SERVICE_RADIUS_KM
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"{label} is outside the "
                "Western Rideshare service area. "
                "Please choose a location within "
                f"{int(SERVICE_RADIUS_KM)} km "
                "of Western University."
            ),
        )


# -------------------------------------------
# GEOCODING / ROUTING
# -------------------------------------------

NOMINATIM_URL = (
    "https://nominatim."
    "openstreetmap.org/search"
)

OSRM_URL = (
    "https://router."
    "project-osrm.org"
)

GEOCODE_CACHE: dict[
    str,
    dict,
] = {}

LAST_GEOCODE_REQUEST = 0.0


def geocode_address(
    address: str,
):

    global LAST_GEOCODE_REQUEST

    normalized_address = (
        address
        .strip()
        .lower()
    )

    if (
        normalized_address
        in GEOCODE_CACHE
    ):

        return (
            GEOCODE_CACHE[
                normalized_address
            ]
        )

    elapsed = (
        time_module.time()
        - LAST_GEOCODE_REQUEST
    )

    if elapsed < 1.05:
        time_module.sleep(
            1.05 - elapsed
        )

    params = {
        "q":
            address,

        "format":
            "jsonv2",

        "limit":
            1,

        "countrycodes":
            "ca",
    }

    headers = {
        "User-Agent":
            "WesternRideshare/3.0",
    }

    try:

        with httpx.Client(
            timeout=15.0,
            headers=headers,
        ) as client:

            response = (
                client.get(
                    NOMINATIM_URL,
                    params=params,
                )
            )

            response.raise_for_status()

    except httpx.HTTPError:

        raise HTTPException(
            status_code=503,
            detail=(
                "Address service is "
                "temporarily unavailable"
            ),
        )

    LAST_GEOCODE_REQUEST = (
        time_module.time()
    )

    results = (
        response.json()
    )

    if not results:

        raise HTTPException(
            status_code=404,
            detail=(
                "Could not find "
                f"address: {address}"
            ),
        )

    result = results[0]

    location = {
        "display_name":
            result[
                "display_name"
            ],

        "lat":
            float(
                result["lat"]
            ),

        "lon":
            float(
                result["lon"]
            ),
    }

    GEOCODE_CACHE[
        normalized_address
    ] = location

    return location


def calculate_route(
    locations: list[dict],
):

    coordinates = ";".join(
        (
            f"{location['lon']},"
            f"{location['lat']}"
        )
        for location
        in locations
    )

    url = (
        f"{OSRM_URL}"
        "/route/v1/driving/"
        f"{coordinates}"
    )

    params = {
        "overview":
            "full",

        "geometries":
            "geojson",

        "steps":
            "false",
    }

    try:

        with httpx.Client(
            timeout=20.0,
        ) as client:

            response = (
                client.get(
                    url,
                    params=params,
                )
            )

            response.raise_for_status()

    except httpx.HTTPError:

        raise HTTPException(
            status_code=503,
            detail=(
                "Routing service is "
                "temporarily unavailable"
            ),
        )

    data = (
        response.json()
    )

    if (
        data.get("code")
        != "Ok"
        or not data.get(
            "routes"
        )
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "No driving route "
                "could be found"
            ),
        )

    route = (
        data["routes"][0]
    )

    route_coordinates = [
        [
            latitude,
            longitude,
        ]
        for longitude, latitude
        in route[
            "geometry"
        ][
            "coordinates"
        ]
    ]

    return {
        "distance_km":
            round(
                route[
                    "distance"
                ]
                / 1000,
                1,
            ),

        "duration_minutes":
            round(
                route[
                    "duration"
                ]
                / 60,
                1,
            ),

        "route_geometry":
            route_coordinates,
    }


# -------------------------------------------
# AUTH
# -------------------------------------------

def create_access_token(
    user_id: int,
):

    expiration = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=
                ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub":
            str(
                user_id
            ),

        "exp":
            expiration,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(
            security
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    token = (
        credentials
        .credentials
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = (
            payload.get(
                "sub"
            )
        )

        if (
            user_id
            is None
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid "
                    "authentication "
                    "token"
                ),
            )

        user_id = (
            int(
                user_id
            )
        )

    except (
        JWTError,
        ValueError,
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid "
                "authentication "
                "token"
            ),
        )

    user = (
        db.query(
            models.User
        )
        .filter(
            models.User.id
            == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail=(
                "User not found"
            ),
        )

    return user


# -------------------------------------------
# SERIALIZERS
# -------------------------------------------

def rating_summary(
    user_id: int,
    db: Session,
):

    average, count = (
        db.query(
            func.avg(
                models.Rating
                .score
            ),
            func.count(
                models.Rating
                .id
            ),
        )
        .filter(
            models.Rating
            .rated_user_id
            == user_id
        )
        .first()
    )

    return {
        "rating_average":
            (
                round(
                    float(
                        average
                    ),
                    2,
                )
                if average
                is not None
                else None
            ),

        "rating_count":
            int(
                count or 0
            ),
    }


def serialize_vehicle(
    driver,
    include_plate=False,
):

    has_vehicle = any(
        [
            driver.vehicle_year,
            driver.vehicle_make,
            driver.vehicle_model,
            driver.vehicle_color,
            driver.license_plate,
        ]
    )

    if not has_vehicle:
        return None

    return {
        "year":
            driver.vehicle_year,

        "make":
            driver.vehicle_make,

        "model":
            driver.vehicle_model,

        "color":
            driver.vehicle_color,

        "license_plate":
            (
                driver.license_plate
                if include_plate
                else None
            ),
    }


def serialize_driver(
    driver,
    db: Session,
    include_private_vehicle=False,
):

    return {
        "id":
            driver.id,

        "name":
            driver.name,

        **rating_summary(
            driver.id,
            db,
        ),

        "vehicle":
            serialize_vehicle(
                driver,
                include_private_vehicle,
            ),
    }


def serialize_ride(
    ride,
    db: Session,
    include_private_vehicle=False,
):

    return {
        "id":
            ride.id,

        "origin":
            ride.origin,

        "destination":
            ride.destination,

        "origin_lat":
            ride.origin_lat,

        "origin_lon":
            ride.origin_lon,

        "destination_lat":
            ride.destination_lat,

        "destination_lon":
            ride.destination_lon,

        "route_geometry":
            ride.route_geometry,

        "departure_time":
            ride.departure_time,

        "distance_km":
            ride.distance_km,

        "duration_minutes":
            ride.duration_minutes,

        "available_seats":
            ride.available_seats,

        "total_seats":
            (
                ride.total_seats
                or ride.available_seats
            ),

        "price_per_seat":
            ride.price_per_seat,

        "status":
            ride.status,

        "started_at":
            ride.started_at,

        "completed_at":
            ride.completed_at,

        "cancelled_at":
            ride.cancelled_at,

        "driver":
            serialize_driver(
                ride.driver,
                db,
                include_private_vehicle,
            ),
    }


def serialize_request(
    request,
    db: Session,
):

    include_private_vehicle = (
        request.status
        == "accepted"
        or request.ride.status
        in {
            "in_progress",
            "completed",
        }
    )

    return {
        "request_id":
            request.id,

        "status":
            request.status,

        "pickup_address":
            request.pickup_address,

        "pickup_lat":
            request.pickup_lat,

        "pickup_lon":
            request.pickup_lon,

        "passenger_distance_km":
            request
            .passenger_distance_km,

        "detour_km":
            request.detour_km,

        "quoted_price":
            request.quoted_price,

        "route_with_pickup_geometry":
            request
            .route_with_pickup_geometry,

        "passenger_route_geometry":
            request
            .passenger_route_geometry,

        "passenger": {
            "id":
                request.passenger.id,

            "name":
                request.passenger.name,

            "email":
                request.passenger.email,

            **rating_summary(
                request.passenger.id,
                db,
            ),
        },

        "ride":
            serialize_ride(
                request.ride,
                db,
                include_private_vehicle,
            ),
    }


def serialize_rating(
    rating,
):

    return {
        "id":
            rating.id,

        "ride_id":
            rating.ride_id,

        "rater_id":
            rating.rater_id,

        "rated_user_id":
            rating.rated_user_id,

        "score":
            rating.score,

        "comment":
            rating.comment,

        "created_at":
            rating.created_at,
    }


# -------------------------------------------
# ROOT
# -------------------------------------------

@app.get("/")
def root():

    return {
        "message":
            "Western Rideshare API",

        "status":
            "running",
    }


@app.get(
    "/service-area"
)
def service_area():

    return {
        "center": {
            "name":
                "Western University",

            "lat":
                WESTERN_LAT,

            "lon":
                WESTERN_LON,
        },

        "radius_km":
            SERVICE_RADIUS_KM,
    }


# -------------------------------------------
# USERS
# -------------------------------------------

@app.post("/users")
def create_user(
    user: UserCreate,

    db:
        Session
        = Depends(
            get_db
        ),
):

    email = (
        user.email
        .lower()
        .strip()
    )

    if not email.endswith(
        "@uwo.ca"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Please use a "
                "Western University "
                "email address"
            ),
        )

    existing_user = (
        db.query(
            models.User
        )
        .filter(
            models.User.email
            == email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email already "
                "registered"
            ),
        )

    new_user = (
        models.User(
            name=
                user.name.strip(),

            email=
                email,

            hashed_password=
                pwd_context.hash(
                    user.password
                ),
        )
    )

    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )

    return {
        "message":
            "User created successfully",

        "user": {
            "id":
                new_user.id,

            "name":
                new_user.name,

            "email":
                new_user.email,
        },
    }


@app.post("/login")
def login(
    user: UserLogin,

    db:
        Session
        = Depends(
            get_db
        ),
):

    email = (
        user.email
        .lower()
        .strip()
    )

    db_user = (
        db.query(
            models.User
        )
        .filter(
            models.User.email
            == email
        )
        .first()
    )

    if (
        not db_user
        or not pwd_context.verify(
            user.password,
            db_user.hashed_password,
        )
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email "
                "or password"
            ),
        )

    access_token = (
        create_access_token(
            db_user.id
        )
    )

    return {
        "message":
            "Login successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user": {
            "id":
                db_user.id,

            "name":
                db_user.name,

            "email":
                db_user.email,
        },
    }


@app.get("/me")
def get_me(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    return {
        "id":
            current_user.id,

        "name":
            current_user.name,

        "email":
            current_user.email,

        "western_verified":
            current_user
            .email
            .endswith(
                "@uwo.ca"
            ),

        "vehicle_year":
            current_user.vehicle_year,

        "vehicle_make":
            current_user.vehicle_make,

        "vehicle_model":
            current_user.vehicle_model,

        "vehicle_color":
            current_user.vehicle_color,

        "license_plate":
            current_user.license_plate,

        **rating_summary(
            current_user.id,
            db,
        ),
    }


@app.patch("/me")
def update_profile(
    profile:
        UserProfileUpdate,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    current_user.name = (
        profile.name.strip()
    )

    current_user.vehicle_year = (
        profile.vehicle_year
    )

    current_user.vehicle_make = (
        profile.vehicle_make.strip()
        if profile.vehicle_make
        else None
    )

    current_user.vehicle_model = (
        profile.vehicle_model.strip()
        if profile.vehicle_model
        else None
    )

    current_user.vehicle_color = (
        profile.vehicle_color.strip()
        if profile.vehicle_color
        else None
    )

    current_user.license_plate = (
        profile
        .license_plate
        .strip()
        .upper()
        if profile.license_plate
        else None
    )

    db.commit()

    db.refresh(
        current_user
    )

    return {
        "message":
            "Profile updated successfully",

        "user":
            get_me(
                current_user,
                db,
            ),
    }


# -------------------------------------------
# ROUTE PREVIEW
# -------------------------------------------

@app.post(
    "/route-preview"
)
def route_preview(
    request:
        RoutePreviewRequest,
):

    origin = (
        geocode_address(
            request.origin
        )
    )

    destination = (
        geocode_address(
            request.destination
        )
    )

    enforce_service_area(
        origin,
        "Starting location",
    )

    enforce_service_area(
        destination,
        "Destination",
    )

    route = (
        calculate_route(
            [
                origin,
                destination,
            ]
        )
    )

    price = (
        calculate_ride_price(
            route[
                "distance_km"
            ]
        )
    )

    return {
        "origin":
            origin,

        "destination":
            destination,

        "distance_km":
            route[
                "distance_km"
            ],

        "duration_minutes":
            route[
                "duration_minutes"
            ],

        "route_geometry":
            route[
                "route_geometry"
            ],

        "price_per_seat":
            price,

        "service_radius_km":
            SERVICE_RADIUS_KM,
    }


# -------------------------------------------
# RIDES
# -------------------------------------------

@app.post("/rides")
def create_ride(
    ride:
        RideCreate,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    if (
        ride.departure_time
        <= datetime.now()
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Departure time "
                "must be in the future"
            ),
        )

    origin = (
        geocode_address(
            ride.origin
        )
    )

    destination = (
        geocode_address(
            ride.destination
        )
    )

    enforce_service_area(
        origin,
        "Starting location",
    )

    enforce_service_area(
        destination,
        "Destination",
    )

    route = (
        calculate_route(
            [
                origin,
                destination,
            ]
        )
    )

    price = (
        calculate_ride_price(
            route[
                "distance_km"
            ]
        )
    )

    new_ride = (
        models.Ride(
            driver_id=
                current_user.id,

            origin=
                origin[
                    "display_name"
                ],

            destination=
                destination[
                    "display_name"
                ],

            origin_lat=
                origin["lat"],

            origin_lon=
                origin["lon"],

            destination_lat=
                destination["lat"],

            destination_lon=
                destination["lon"],

            route_geometry=
                route[
                    "route_geometry"
                ],

            departure_time=
                ride.departure_time,

            distance_km=
                route[
                    "distance_km"
                ],

            duration_minutes=
                route[
                    "duration_minutes"
                ],

            available_seats=
                ride.available_seats,

            total_seats=
                ride.available_seats,

            price_per_seat=
                price,

            status=
                "active",
        )
    )

    db.add(
        new_ride
    )

    db.commit()

    db.refresh(
        new_ride
    )

    return {
        "message":
            "Ride created successfully",

        "ride":
            serialize_ride(
                new_ride,
                db,
            ),
    }


@app.get("/rides")
def get_rides(
    origin:
        str | None
        = Query(
            default=None
        ),

    destination:
        str | None
        = Query(
            default=None
        ),

    ride_date:
        date | None
        = Query(
            default=None
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    query = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.status
            == "active",

            models.Ride.available_seats
            > 0,
        )
    )

    if origin:

        query = (
            query.filter(
                models.Ride.origin
                .ilike(
                    f"%{origin.strip()}%"
                )
            )
        )

    if destination:

        query = (
            query.filter(
                models.Ride.destination
                .ilike(
                    f"%{destination.strip()}%"
                )
            )
        )

    if ride_date:

        start_datetime = (
            datetime.combine(
                ride_date,
                time.min,
            )
        )

        end_datetime = (
            datetime.combine(
                ride_date,
                time.max,
            )
        )

        query = (
            query.filter(
                models.Ride.departure_time
                >= start_datetime,

                models.Ride.departure_time
                <= end_datetime,
            )
        )

    rides = (
        query
        .order_by(
            models.Ride
            .departure_time
            .asc()
        )
        .all()
    )

    return [
        serialize_ride(
            ride,
            db,
        )
        for ride
        in rides
    ]


@app.get(
    "/rides/{ride_id}"
)
def get_ride(
    ride_id: int,

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    return serialize_ride(
        ride,
        db,
    )


@app.get("/my-rides")
def get_my_rides(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    rides = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.driver_id
            == current_user.id
        )
        .order_by(
            models.Ride
            .departure_time
            .desc()
        )
        .all()
    )

    return [
        serialize_ride(
            ride,
            db,
            True,
        )
        for ride
        in rides
    ]


@app.delete(
    "/rides/{ride_id}"
)
def cancel_ride(
    ride_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .with_for_update()
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    if (
        ride.driver_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not "
                "the driver of "
                "this ride"
            ),
        )

    if (
        ride.status
        != "active"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only active rides "
                "can be cancelled"
            ),
        )

    ride.status = (
        "cancelled"
    )

    ride.cancelled_at = (
        datetime.now()
    )

    for request in (
        ride.requests
    ):

        if request.status in {
            "pending",
            "accepted",
        }:

            request.status = (
                "cancelled"
            )

    db.commit()

    return {
        "message":
            "Ride cancelled successfully"
    }


@app.post(
    "/rides/{ride_id}/start"
)
def start_ride(
    ride_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .with_for_update()
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    if (
        ride.driver_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not "
                "the driver of "
                "this ride"
            ),
        )

    if (
        ride.status
        != "active"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only active rides "
                "can be started"
            ),
        )

    ride.status = (
        "in_progress"
    )

    ride.started_at = (
        datetime.now()
    )

    db.commit()

    return {
        "message":
            "Ride started"
    }


@app.post(
    "/rides/{ride_id}/complete"
)
def complete_ride(
    ride_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .with_for_update()
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    if (
        ride.driver_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not "
                "the driver of "
                "this ride"
            ),
        )

    if (
        ride.status
        != "in_progress"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Start the ride "
                "before completing it"
            ),
        )

    ride.status = (
        "completed"
    )

    ride.completed_at = (
        datetime.now()
    )

    db.commit()

    return {
        "message":
            (
                "Ride completed "
                "and moved to "
                "your archive"
            )
    }


# -------------------------------------------
# PASSENGER REQUESTS
# -------------------------------------------

@app.post(
    "/rides/{ride_id}/request"
)
def request_ride(
    ride_id: int,

    request:
        RideRequestCreate,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    if (
        ride.status
        != "active"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This ride is "
                "not active"
            ),
        )

    if (
        ride.driver_id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot request "
                "your own ride"
            ),
        )

    if (
        ride.available_seats
        <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "No seats are available"
            ),
        )

    existing_request = (
        db.query(
            models.RideRequest
        )
        .filter(
            models.RideRequest
            .ride_id
            == ride.id,

            models.RideRequest
            .passenger_id
            == current_user.id,

            models.RideRequest
            .status
            .in_(
                [
                    "pending",
                    "accepted",
                ]
            ),
        )
        .first()
    )

    if existing_request:

        raise HTTPException(
            status_code=400,
            detail=(
                "You already requested "
                "this ride"
            ),
        )

    pickup = (
        geocode_address(
            request.pickup_address
        )
    )

    enforce_service_area(
        pickup,
        "Pickup location",
    )

    origin = {
        "lat":
            ride.origin_lat,

        "lon":
            ride.origin_lon,
    }

    destination = {
        "lat":
            ride.destination_lat,

        "lon":
            ride.destination_lon,
    }

    route_with_pickup = (
        calculate_route(
            [
                origin,
                pickup,
                destination,
            ]
        )
    )

    passenger_route = (
        calculate_route(
            [
                pickup,
                destination,
            ]
        )
    )

    detour_km = (
        round(
            max(
                0,
                route_with_pickup[
                    "distance_km"
                ]
                - ride.distance_km,
            ),
            1,
        )
    )

    if (
        detour_km
        > 15
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Pickup location adds "
                "more than 15 km to "
                "the driver's route"
            ),
        )

    new_request = (
        models.RideRequest(
            ride_id=
                ride.id,

            passenger_id=
                current_user.id,

            pickup_address=
                pickup[
                    "display_name"
                ],

            pickup_lat=
                pickup["lat"],

            pickup_lon=
                pickup["lon"],

            passenger_distance_km=
                passenger_route[
                    "distance_km"
                ],

            detour_km=
                detour_km,

            quoted_price=
                calculate_ride_price(
                    passenger_route[
                        "distance_km"
                    ]
                ),

            route_with_pickup_geometry=
                route_with_pickup[
                    "route_geometry"
                ],

            passenger_route_geometry=
                passenger_route[
                    "route_geometry"
                ],

            status=
                "pending",
        )
    )

    db.add(
        new_request
    )

    db.commit()

    db.refresh(
        new_request
    )

    return {
        "message":
            "Ride request sent",

        "request":
            serialize_request(
                new_request,
                db,
            ),
    }


@app.get(
    "/my-requests"
)
def get_my_requests(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    requests = (
        db.query(
            models.RideRequest
        )
        .filter(
            models.RideRequest
            .passenger_id
            == current_user.id
        )
        .order_by(
            models.RideRequest
            .id
            .desc()
        )
        .all()
    )

    return [
        serialize_request(
            request,
            db,
        )
        for request
        in requests
    ]


@app.delete(
    "/requests/{request_id}"
)
def cancel_request(
    request_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    request = (
        db.query(
            models.RideRequest
        )
        .filter(
            models.RideRequest.id
            == request_id
        )
        .with_for_update()
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride request "
                "not found"
            ),
        )

    if (
        request.passenger_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "This is not your "
                "ride request"
            ),
        )

    if (
        request.ride.status
        in {
            "in_progress",
            "completed",
        }
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This trip can no "
                "longer be cancelled"
            ),
        )

    if (
        request.status
        not in {
            "pending",
            "accepted",
        }
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This request can no "
                "longer be cancelled"
            ),
        )

    if (
        request.status
        == "accepted"
    ):

        ride = (
            db.query(
                models.Ride
            )
            .filter(
                models.Ride.id
                == request.ride_id
            )
            .with_for_update()
            .first()
        )

        ride.available_seats = (
            min(
                (
                    ride.total_seats
                    or ride.available_seats
                    + 1
                ),
                ride.available_seats
                + 1,
            )
        )

    request.status = (
        "cancelled"
    )

    db.commit()

    return {
        "message":
            "Ride request cancelled"
    }


# -------------------------------------------
# DRIVER REQUESTS
# -------------------------------------------

@app.get(
    "/driver/requests"
)
def get_driver_requests(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    requests = (
        db.query(
            models.RideRequest
        )
        .join(
            models.Ride
        )
        .filter(
            models.Ride.driver_id
            == current_user.id
        )
        .order_by(
            models.RideRequest
            .id
            .desc()
        )
        .all()
    )

    return [
        serialize_request(
            request,
            db,
        )
        for request
        in requests
    ]


@app.post(
    "/requests/{request_id}/accept"
)
def accept_request(
    request_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    request = (
        db.query(
            models.RideRequest
        )
        .filter(
            models.RideRequest.id
            == request_id
        )
        .with_for_update()
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride request "
                "not found"
            ),
        )

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == request.ride_id
        )
        .with_for_update()
        .first()
    )

    if (
        ride.driver_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not "
                "the driver"
            ),
        )

    if (
        ride.status
        != "active"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This ride is "
                "not active"
            ),
        )

    if (
        request.status
        != "pending"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Request has already "
                "been processed"
            ),
        )

    if (
        ride.available_seats
        <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "No available seats"
            ),
        )

    request.status = (
        "accepted"
    )

    ride.available_seats -= 1

    db.commit()

    return {
        "message":
            "Ride request accepted",

        "available_seats":
            ride.available_seats,
    }


@app.post(
    "/requests/{request_id}/decline"
)
def decline_request(
    request_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    request = (
        db.query(
            models.RideRequest
        )
        .filter(
            models.RideRequest.id
            == request_id
        )
        .with_for_update()
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride request "
                "not found"
            ),
        )

    if (
        request.ride.driver_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not "
                "the driver"
            ),
        )

    if (
        request.status
        != "pending"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Request has already "
                "been processed"
            ),
        )

    request.status = (
        "declined"
    )

    db.commit()

    return {
        "message":
            "Ride request declined"
    }


# -------------------------------------------
# RATINGS
# -------------------------------------------

@app.post(
    "/rides/{ride_id}/ratings"
)
def create_rating(
    ride_id: int,

    rating:
        RatingCreate,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ride = (
        db.query(
            models.Ride
        )
        .filter(
            models.Ride.id
            == ride_id
        )
        .first()
    )

    if not ride:

        raise HTTPException(
            status_code=404,
            detail=(
                "Ride not found"
            ),
        )

    if (
        ride.status
        != "completed"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Ratings open after "
                "the trip is completed"
            ),
        )

    if (
        rating.rated_user_id
        == current_user.id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot rate yourself"
            ),
        )

    accepted_requests = [
        request
        for request
        in ride.requests
        if request.status
        == "accepted"
    ]

    accepted_passenger_ids = {
        request.passenger_id
        for request
        in accepted_requests
    }

    allowed = False

    if (
        current_user.id
        == ride.driver_id
    ):

        allowed = (
            rating.rated_user_id
            in accepted_passenger_ids
        )

    elif (
        current_user.id
        in accepted_passenger_ids
    ):

        allowed = (
            rating.rated_user_id
            == ride.driver_id
        )

    if not allowed:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only rate "
                "people you completed "
                "this ride with"
            ),
        )

    new_rating = (
        models.Rating(
            ride_id=
                ride.id,

            rater_id=
                current_user.id,

            rated_user_id=
                rating.rated_user_id,

            score=
                rating.score,

            comment=
                (
                    rating
                    .comment
                    .strip()
                    if rating.comment
                    else None
                ),
        )
    )

    db.add(
        new_rating
    )

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "You already rated "
                "this person for "
                "this ride"
            ),
        )

    db.refresh(
        new_rating
    )

    return {
        "message":
            "Rating submitted",

        "rating":
            serialize_rating(
                new_rating
            ),
    }


@app.get(
    "/rides/{ride_id}/my-ratings"
)
def get_my_ratings(
    ride_id: int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    ratings = (
        db.query(
            models.Rating
        )
        .filter(
            models.Rating.ride_id
            == ride_id,

            models.Rating.rater_id
            == current_user.id,
        )
        .all()
    )

    return [
        serialize_rating(
            rating
        )
        for rating
        in ratings
    ]


# -------------------------------------------
# IMPACT
# -------------------------------------------

@app.get("/impact")
def get_impact(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):

    accepted_requests = (
        db.query(
            models.RideRequest
        )
        .join(
            models.Ride
        )
        .filter(
            models.RideRequest.status
            == "accepted",

            models.Ride.status
            .in_(
                [
                    "active",
                    "in_progress",
                    "completed",
                ]
            ),
        )
        .all()
    )

    shared_ride_ids = {
        request.ride_id
        for request
        in accepted_requests
    }

    passenger_km = sum(
        (
            request
            .passenger_distance_km
            or 0
        )
        for request
        in accepted_requests
    )

    estimated_co2_kg_saved = (
        round(
            passenger_km
            * 0.192,
            1,
        )
    )

    return {
        "shared_rides":
            len(
                shared_ride_ids
            ),

        "accepted_passengers":
            len(
                accepted_requests
            ),

        "estimated_vehicles_avoided":
            len(
                accepted_requests
            ),

        "estimated_co2_kg_saved":
            estimated_co2_kg_saved,
    }