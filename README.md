# CafeMate

Cafe ordering app from the CafeMate project documentation. Customers customize drinks and snacks in the mobile app. Cafe staff process those orders on a web dashboard. There is no payment step in this version.

- Mobile app: React Native (Expo) and JavaScript
- API: Django and Django REST Framework
- Database: PostgreSQL
- Auth: JWT, with customer, staff, and admin roles

## What you can do

Customers can browse categories, open a product, choose customization options, add the item to the cart, review the order, and place it. The server calculates the price. Staff move an order from New to Accepted, Preparing, Ready, and Completed. The customer can see that status. Admins can manage categories, products, customization options, and staff accounts.

## Requirements

- Python 3.12 or newer
- Node.js 20 or newer. The `node` command on this PC is version 16, which cannot start this app. Install Node.js 20 or 24, then open a new terminal.
- PostgreSQL 16 or newer
- Expo Go on a phone, or an Android/iOS simulator

## 1. PostgreSQL

PostgreSQL 18 is already running on this computer (`postgresql-x64-18`). The sample password `postgres` was rejected, so set `DB_PASSWORD` in `backend/.env` to the password chosen when PostgreSQL was installed. Then create the database:

```bat
"D:\DataBase\bin\psql.exe" -U postgres -c "CREATE DATABASE cafemate;"
```

If PostgreSQL is installed somewhere else, use that `psql` and match `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in `backend/.env`.

If you use Docker:

```bash
docker compose up -d
```

## 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver 0.0.0.0:8000
```

Open the staff dashboard at http://localhost:8000

| Role | Username | Password |
| --- | --- | --- |
| Customer | nahid | nahid123 |
| Staff | staff | staff123 |
| Admin | admin | admin123 |

These accounts are for local development only.

Run the API tests after PostgreSQL is running:

```bash
python manage.py test
```

## 3. Mobile app

```bash
cd mobile
npm install
npx expo start
```

On the sign-in screen, set the API server:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Phone on the same Wi-Fi: `http://YOUR-PC-IP:8000`

Sign in as `nahid` / `nahid123`, open Milk Tea, keep Sugar at 2 spoons, set Milk to Extra and add Ginger, set quantity to 2, and place the order. The server total is ৳60. The same order shows on the dashboard for `staff`.

## API

Public menu:

- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/products/{id}/customizations`

Customer orders, with a JWT:

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/{id}`

Staff order board:

- `GET /api/dashboard/orders`
- `GET /api/dashboard/summary`
- `PUT /api/dashboard/orders/{id}/accept`
- `PUT /api/dashboard/orders/{id}/preparing`
- `PUT /api/dashboard/orders/{id}/ready`
- `PUT /api/dashboard/orders/{id}/complete`

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
