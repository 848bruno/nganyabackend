@url = http://localhost:3000
@token = {{login.response.body.access_token}}

###############################################
# Authentication
###############################################

### Login to get JWT token
# @name login
POST {{url}}/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "customer123"
}

###############################################
# User Controller
###############################################

### Get all users
GET {{url}}/users
Authorization: Bearer {{token}}

### Get user by ID
GET {{url}}/users/33333333-3333-3333-3333-333333333333
Authorization: Bearer {{token}}

### Create new user
POST {{url}}/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "role": "customer",
  "phone": "456-789-0123"
}

### Update user
PATCH {{url}}/users/33333333-3333-3333-3333-333333333333
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Test User"
}

### Delete user
DELETE {{url}}/users/33333333-3333-3333-3333-333333333333
Authorization: Bearer {{token}}

###############################################
# Vehicle Controller
###############################################

### Get all vehicles
GET {{url}}/vehicles
Authorization: Bearer {{token}}

### Get vehicle by ID
GET {{url}}/vehicles/44444444-4444-4444-4444-444444444444
Authorization: Bearer {{token}}

### Create new vehicle
POST {{url}}/vehicles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "licensePlate": "GHI789",
  "type": "sedan",
  "status": "available",
  "model": "Honda Accord",
  "year": 2023
}

### Update vehicle
PATCH {{url}}/vehicles/44444444-4444-4444-4444-444444444444
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "model": "Updated Honda Accord"
}

### Delete vehicle
DELETE {{url}}/vehicles/44444444-4444-4444-4444-444444444444
Authorization: Bearer {{token}}

###############################################
# Driver Controller
###############################################

### Get all drivers
GET {{url}}/drivers
Authorization: Bearer {{token}}

### Get driver by ID
GET {{url}}/drivers/77777777-7777-7777-7777-777777777777
Authorization: Bearer {{token}}

### Create new driver
POST {{url}}/drivers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": "22222222-2222-2222-2222-222222222222",
  "licenseNumber": "DL987654",
  "rating": 4.0,
  "vehicleId": "55555555-5555-5555-5555-555555555555"
}

### Update driver
PATCH {{url}}/drivers/77777777-7777-7777-7777-777777777777
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "rating": 4.8
}

### Delete driver
DELETE {{url}}/drivers/77777777-7777-7777-7777-777777777777
Authorization: Bearer {{token}}

###############################################
# Route Controller
###############################################

### Get all routes
GET {{url}}/routes
Authorization: Bearer {{token}}

### Get route by ID
GET {{url}}/routes/88888888-8888-8888-8888-888888888888
Authorization: Bearer {{token}}

### Create new route
POST {{url}}/routes
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "driverId": "77777777-7777-7777-7777-777777777777",
  "startPoint": { "lat": 40.7128, "lng": -74.0060 },
  "endPoint": { "lat": 40.7484, "lng": -73.9857 },
  "stops": [{ "lat": 40.7306, "lng": -73.9953 }],
  "startTime": "2025-07-04T10:00:00Z",
  "availableSeats": 2
}

### Update route
PATCH {{url}}/routes/88888888-8888-8888-8888-888888888888
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "availableSeats": 1
}

### Delete route
DELETE {{url}}/routes/88888888-8888-8888-8888-888888888888
Authorization: Bearer {{token}}

###############################################
# Ride Controller
###############################################

### Get all rides
GET {{url}}/rides
Authorization: Bearer {{token}}

### Get ride by ID
GET {{url}}/rides/99999999-9999-9999-9999-999999999999
Authorization: Bearer {{token}}

### Create new ride
POST {{url}}/rides
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "driverId": "77777777-7777-7777-7777-777777777777",
  "vehicleId": "44444444-4444-4444-4444-444444444444",
  "routeId": "88888888-8888-8888-8888-888888888888",
  "pickUpLocation": { "lat": 40.7128, "lng": -74.0060 },
  "dropOffLocation": { "lat": 40.7484, "lng": -73.9857 },
  "type": "private",
  "status": "pending",
  "fare": 20.0,
  "startTime": "2025-07-04T12:00:00Z"
}

### Update ride
PATCH {{url}}/rides/99999999-9999-9999-9999-999999999999
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "fare": 22.0
}

### Delete ride
DELETE {{url}}/rides/99999999-9999-9999-9999-999999999999
Authorization: Bearer {{token}}

###############################################
# Booking Controller
###############################################

### Get all bookings
GET {{url}}/bookings
Authorization: Bearer {{token}}

### Get booking by ID
GET {{url}}/bookings/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
Authorization: Bearer {{token}}

### Create new booking
POST {{url}}/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": "33333333-3333-3333-3333-333333333333",
  "rideId": "99999999-9999-9999-9999-999999999999",
  "type": "ride",
  "status": "pending",
  "seatNumber": 1
}

### Update booking
PATCH {{url}}/bookings/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "confirmed"
}

### Delete booking
DELETE {{url}}/bookings/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
Authorization: Bearer {{token}}

###############################################
# Delivery Controller
###############################################

### Get all deliveries
GET {{url}}/deliveries
Authorization: Bearer {{token}}

### Get delivery by ID
GET {{url}}/deliveries/cccccccc-cccc-cccc-cccc-cccccccccccc
Authorization: Bearer {{token}}

### Create new delivery
POST {{url}}/deliveries
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": "33333333-3333-3333-3333-333333