# Distribution System API (Backend)

## 📖 Overview

This is the backend service for the Distribution System. It provides RESTful APIs for managing users, products, orders, vendors, and authentication.

Built with **FastAPI**, the system is designed to be fast, scalable, and easy to maintain.

---

## 🚀 Features

* User authentication (JWT-based)
* Role-based access (Admin, Vendor, Customer)
* Product management
* Order processing
* Vendor management
* API documentation with Swagger

---

## 🛠️ Tech Stack

* FastAPI
* PostgreSQL
* SQLAlchemy
* Pydantic
* Uvicorn
* JWT Authentication

---

## 📂 Project Structure

```
backend/
│── main.py
│── database.py
│── models.py
│── schemas.py
│── routes/
│   ├── auth.py
│   ├── products.py
│   ├── orders.py
│   ├── vendors.py
│   └── admin.py
│── utils/
│── requirements.txt
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/My-app-backend.git
cd My-app-backend
```

### 2. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

---

## ▶️ Running the Server

```bash
uvicorn main:app --reload
```

Server will run on:

```
http://127.0.0.1:8000
```

---

## 📄 API Documentation

Interactive docs available at:

* Swagger UI: `/docs`
* ReDoc: `/redoc`

---

## 🔐 Authentication

This API uses **JWT Bearer Tokens**.

Example:

```
Authorization: Bearer <your_token>
```

---

## 🧪 Testing

You can test endpoints using:

* Postman
* Thunder Client
* Swagger UI

---

## 🚧 Future Improvements

* Payment integration
* Notifications system
* Analytics dashboard
* Caching (Redis)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License
