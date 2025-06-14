# Next Youth - Freelance Marketplace Platform  

Next Youth is a complete freelance marketplace platform connecting businesses with skilled professionals worldwide. This fullstack application includes both client and server components with all marketplace functionality.

## Key Features

### 🛠️ Core Functionality
- **User Authentication** (Client, Freelancer, Admin)
- **Service Listings** with search/filter capabilities
- **Order Management System**
- **Secure Payment Processing**
- **Real-time Messaging**
- **Ratings & Reviews**

### 💻 Frontend (React)
- Responsive UI with dark/light mode
- Interactive dashboard for all user types
- Advanced search with suggestions
- Service browsing and booking flow
- Real-time notifications

### ⚙️ Backend (Node.js/Express)
- RESTful API with JWT authentication
- MongoDB database with optimized queries
- File upload handling (images, documents)
- Payment gateway integration
- Email notification system

## Tech Stack

**Frontend:**  
- React 18
- React Router 6
- Redux Toolkit
- Axios
- Socket.io (for real-time features)
- Tailwind CSS

**Backend:**  
- Node.js
- Express
- MongoDB (with Mongoose)
- JWT Authentication
- Stripe API (payments)
- Nodemailer (emails)

**DevOps:**  
- Docker
- CI/CD Pipeline
- AWS S3 (file storage)

## Installation

### Prerequisites
- Node.js 16+
- MongoDB 5+
- Redis (for caching)
- Stripe account (for payments)


## Project Structure

```
next-youth/
├── client/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/       # Static files
│   │   ├── components/   # Reusable components
│   │   ├── features/     # Feature modules
│   │   ├── pages/        # Application pages
│   │   ├── store/        # Redux store
│   │   └── utils/        # Helper functions
│   └── Dockerfile
│
├── server/               # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## API Documentation

The backend API is documented with Swagger. After starting the server, access the docs at:
`http://localhost:4000/api-docs`

Key endpoints include:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/services` - Browse services
- `POST /api/orders` - Create new order
- `GET /api/conversations` - Message history

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

For inquiries or support, please contact:  
**Project Maintainer**: AHANAF ABID SAZID 
**Email**: contact@nextyouth.example  
**Website**: https://next-youth.vercel.app
