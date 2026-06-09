# RoadGuard App

RoadGuard is a MERN Stack-based roadside assistance platform designed to connect vehicle owners with nearby mechanics and service providers during emergencies. The application helps users quickly request assistance, track service requests, and receive real-time updates.

## Project Overview

RoadGuard aims to simplify roadside emergency support by providing a centralized platform where users can:

- Request roadside assistance
- Find nearby mechanics and service centers
- Track service request status
- View mechanic details and availability
- Manage emergency support requests
- Access location-based services

## Features

### User Features

- User Registration and Authentication
- Secure Login System
- Create Assistance Requests
- Real-Time Request Tracking
- Location-Based Service Discovery
- View Request History
- Profile Management

### Service Provider Features

- Mechanic Registration
- Availability Management
- Accept or Reject Requests
- Customer Information Access
- Service Request Dashboard

### Admin Features

- User Management
- Mechanic Management
- Request Monitoring
- Platform Analytics

## Tech Stack

### client

- React.js
- React Router
- Axios
- Bootstrap / Material UI
- CSS3

### server

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JWT (JSON Web Tokens)
- Bcrypt.js

### Additional Services

- Google Maps API (if implemented)
- Location Services
- RESTful APIs

## Project Structure

```text
roadGuard-app/
│
├── server/
│   ├── .env
│   └── server.js
│
├── client/
│   ├── public/
│   ├── src/
│   │   └── App.js
│
├── .gitignore
├── package.json
├── README.md
```

## Installation

### Clone the Repository

```bash
git clone https://github.com/1MdAnas1/roadGuard-app.git
cd roadGuard-app
```

### Install server Dependencies

```bash
cd server
npm install
```

### Install client Dependencies

```bash
cd ../client
npm install
```

## Environment Variables

Edit the `.env` file inside the server directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Running the Application

### Start server Server

```bash
cd server
npm run dev
```

### Start client Server

```bash
cd client
npm start
```

### Access Application

```text
client: http://localhost:3000
server: http://localhost:5000
```

## API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Users

```http
GET /api/users/profile
PUT /api/users/profile
```

### Assistance Requests

```http
POST /api/requests
GET /api/requests
PUT /api/requests/:id
DELETE /api/requests/:id
```

## Future Enhancements

- Real-Time Location Tracking
- Push Notifications
- Payment Gateway Integration
- Service Ratings and Reviews
- AI-Based Mechanic Recommendation
- Mobile Application Support
- Emergency SOS Feature

## Learning Outcomes

This project demonstrates:

- Full Stack Web Development
- REST API Development
- Authentication & Authorization
- Database Design
- MERN Stack Architecture
- State Management
- Responsive UI Development

## Author

**Mohd Anas Siddique**
