# Budget Tracker

A full-stack personal finance application with a modern React frontend and Express backend for comprehensive budget management, expense tracking, and financial planning.

## 🚀 Key Features

- **Account Management**: Track multiple accounts with real-time balances
- **Transaction Tracking**: Record expenses/income with receipt image uploads and categorization
- **Budget Planning**: Set daily/weekly/monthly/yearly budgets by category with visual progress tracking
- **Reporting & Analytics**: Visualize spending patterns, compare income vs expenses, and export reports
- **Responsive UI**: Dark mode interface that works on all devices
- **Secure Authentication**: JWT-based protection with user-specific data isolation

## 💻 Technology Stack

### Backend
- **Node.js & Express**: Fast, unopinionated web framework
- **MongoDB & Mongoose**: Flexible document database with elegant ODM
- **JSON Web Tokens**: Secure authentication
- **AWS S3 Integration**: For receipt image storage
- **RESTful API**: Well-structured endpoints with Swagger documentation

### Frontend
- **React**: Component-based UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Chart.js**: Interactive data visualization
- **React Router**: Declarative routing

## 📋 Prerequisites

- Docker installed on your machine
- Git for cloning the repository
- Node.js 16+ and npm for local development

## 🐳 Docker Setup

### Clone the repository

```bash
git clone --branch main https://github.com/jorge-ld8/budget-tracking.git budget-project
cd budget-project
```

### Build and run with Docker

```bash
# Build the Docker image
docker build -t budgetproject:latest .

# Run the container
docker run -v .:/app -v /app/node_modules --name budgetContainer -p 3012:3010 budgetproject:latest
```

### Using Docker Compose (alternative)

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

## 💻 Development

### Backend Environment Variables

Create a `.env` file in the root directory:

```
PORT=3010
MONGO_URI=mongodb://localhost:27017/budget
JWT_SECRET=your_jwt_secret
NODE_ENV=development
AWS_BUCKET_NAME=your_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
```

### Frontend Development

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend.

## 📚 API Documentation

Access the Swagger UI documentation at:

```
http://localhost:3012/api-docs
```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ by Jorge Leon
