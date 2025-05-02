app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL || "https://next-youth-client.onrender.com",
}));