# XORIVA backend

## Admin panel

The admin API is isolated in:

- `Middleware/adminMiddleware.js`
- `Controller/adminController.js`
- `Route/adminRoutes.js`

All admin routes require a valid JWT for a user whose `role` is `admin`.

### Promote the first administrator

The user must already be registered and verified:

```powershell
npm run make:admin -- admin@example.com
```

Then sign in normally in the frontend and open `/admin`.

### Admin capabilities

- Dashboard metrics for customers, retail products, thrift review, orders, and paid revenue
- Retail product create, edit, and delete
- Thrift listing approval, rejection, and withdrawal
- Order and payment status updates
- User search and role management

The frontend admin module lives in `XORIVA/src/admin`.
