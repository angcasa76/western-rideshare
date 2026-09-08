# Western Rideshare

A full-stack ridesharing platform designed for Western University students, allowing drivers to post rides and passengers to request seats through a centralized university-focused platform.

## Overview

Western Rideshare was built to make student transportation more affordable, organized, and accessible.

The platform supports complete driver and passenger workflows, including ride creation, ride requests, seat management, trip status updates, route calculations, vehicle information, and two-way ratings.

## Features

- User authentication with JWT
- Driver and passenger workflows
- Ride creation and ride search
- Passenger ride requests
- Driver accept / decline functionality
- Seat availability tracking
- Trip lifecycle management
  - Active
  - In Progress
  - Completed
  - Cancelled
- Vehicle information
- Two-way driver and passenger ratings
- Ride history and archive
- Address autocomplete
- Interactive route visualization
- Passenger pickup routing
- Distance calculations
- Automated distance-based pricing
- Frontend polling for updated ride information
- Database locking for concurrent seat updates

## Tech Stack

### Frontend
- TypeScript
- React
- Next.js
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication

### Database
- PostgreSQL

### Mapping and Routing
- OpenStreetMap
- Photon
- OSRM

## How It Works

### Drivers

Drivers can:

1. Create a ride
2. Enter trip and vehicle information
3. View passenger requests
4. Accept or decline passengers
5. Start and complete trips
6. View completed and cancelled rides
7. Rate passengers after completed trips

### Passengers

Passengers can:

1. Search for available rides
2. Request a seat
3. View request status
4. Track ride information
5. View completed and cancelled rides
6. Rate drivers after completed trips

## Backend Architecture

The backend is built with FastAPI and SQLAlchemy using a PostgreSQL relational database.

RESTful APIs manage:

- Authentication
- Users
- Drivers
- Passengers
- Rides
- Ride requests
- Seat availability
- Vehicle information
- Trip status
- Ratings

JWT authentication is used to secure protected endpoints.

Row-level database locking is used during seat updates to reduce the risk of conflicting requests when multiple passengers interact with the same ride.

## Mapping and Routing

Western Rideshare integrates multiple OpenStreetMap-based services:

- **Photon** for address autocomplete
- **OSRM** for route generation and distance calculations
- **OpenStreetMap** for map visualization

These services are used to calculate trip distances, visualize routes, determine passenger pickup routing, and support automated pricing.

## Project Structure

```text
western-rideshare/
├── backend/
├── frontend/
├── README.md
└── ...