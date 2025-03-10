# MyCorner Backend

A FastAPI backend for the MyCorner application.

## Project Structure

```
backend/
├── app/                    # Main application package
│   ├── __init__.py         # Package initializer
│   ├── main.py             # FastAPI application setup
│   ├── config/             # Configuration module
│   │   ├── __init__.py
│   │   └── settings.py     # Environment and settings
│   └── routes/             # API route modules
│       ├── __init__.py
│       ├── users.py        # User-related endpoints
│       ├── webhooks.py     # Webhook handlers
│       └── test.py         # Testing endpoints
└── run.py                  # Server startup script
```

## Setup

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   Create a `.env.local` file in the `backend/` directory with the following:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   ```

## Running the Server

You can run the server in two ways:

1. Using the run script:

   ```
   # From backend directory
   python run.py
   ```

2. Using uvicorn directly:
   ```
   # From backend directory
   uvicorn app.main:app --reload
   ```

## API Endpoints

### User Management

- `POST /sync-user`: Synchronize user data between Clerk and Supabase

### Webhooks

- `POST /webhook/clerk`: Handle Clerk webhook events (currently supports user deletion)

### Testing

- `GET /`: Simple health check endpoint
- `POST /test-webhook`: Test endpoint to simulate user deletion webhook

## Development

### API Documentation

When the server is running, you can access the API documentation at:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Testing Webhooks

To test Clerk webhooks:

1. Use ngrok to expose your local server: `ngrok http 8000`
2. Configure the webhook URL in Clerk's dashboard
3. Alternatively, use the `/test-webhook` endpoint for local testing

## Adding New Features

- Create new route modules in the `app/routes/` directory
- Add business logic in appropriate modules
- Import and include new routers in `app/main.py`
