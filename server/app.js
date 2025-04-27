// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Check if auth routes are mounted correctly like this:
app.use('/api/auth', authRouter);