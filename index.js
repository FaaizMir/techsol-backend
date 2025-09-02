const express = require('express')
const dotenv = require('dotenv')
const authRoutes = require('./routes/auth')
const protectedRoutes = require('./routes/protected')

const sequelize = require('./models/index')
const cors = require('cors')
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/protected', protectedRoutes)
sequelize.sync()

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))