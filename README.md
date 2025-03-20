# Budget Project

An Express application for managing personal finances with user accounts, budget tracking, and expense management.

## 🚀 Features

- User authentication with JWT
- Account management with soft delete functionality
- Expense tracking and categorization
- Budget planning and monitoring
- RESTful API with Swagger documentation

## 📦 Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- Git for cloning the repository

## 🐳 Docker Setup

### Clone the repository

```bash
git clone --branch main https://github.com/jorge-ld8/budget-tracking.git budget-project
cd budget-project
```
https://github.com/jorge-ld8/budget-tracking.git
### Build the Docker image

```bash
# Build the Docker image
docker build -t budgetproject:latest .
```

## 🏃‍♂️ Running the Application

### Using Docker run

```bash
docker run  -v .:/app -v /app/node_modules --name budgetContainer -p 3012:3010 budgetproject:latest
```

### Using Docker Compose (alternative)

For convenience, you can also use Docker Compose:

```bash
# Start the application
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop the application
docker-compose down
```

## ❗ Troubleshooting

### Port Already In Use

If port 3012 is already in use:
```bash
docker run --rm -v .:/app -v /app/node_modules --name budgetContainer -p 3013:3010 budgetproject:latest
```

## 📚 API Documentation

The API documentation is available through Swagger UI:

```
http://localhost:3012/api-docs
```

## 🛠️ Development

### Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middlewares/     # Express middlewares
│   ├── interfaces/      # Base classes and interfaces
│   ├── errors/          # Error handling
│   ├── swagger.js       # Swagger configuration
│   └── app.js           # Express application
├── server.js            # Entry point
├── .env                 # Environment variables
├── .env.development     # Development environment variables
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── package.json         # Project dependencies
```

### Environment Variables

Create a `.env` file in the root directory:

```
PORT=3010
MONGO_URI=mongodb://localhost:27017/budget
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Running in Development Mode

```bash
# Using npm
npm run dev

# Using Docker
docker run --rm -v .:/app -v /app/node_modules -p 3012:3010 --name budgetContainer -e NODE_ENV=development budgetproject:latest npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ by Jorge Leon
