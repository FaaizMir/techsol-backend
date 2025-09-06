const express = require('express')
const dotenv = require('dotenv')
// Load environment variables early so modules that require them at load time see them
dotenv.config()
const authRoutes = require('./routes/auth')
const protectedRoutes = require('./routes/protected')

const cors = require('cors')
const sequelize = require('./models/index')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/protected', protectedRoutes)
// Start up: authenticate and sync DB, then start HTTP server
async function start() {
	try {
		await sequelize.authenticate()
		console.log('Database connection authenticated')
		await sequelize.sync()
		console.log('Database synced')

		const PORT = process.env.PORT || 5000
		const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

		// Graceful shutdown helper
		const shutdown = async (signal) => {
			console.log(`Received ${signal}. Shutting down gracefully...`)
			try {
				server.close(async () => {
					try {
						await sequelize.close()
						console.log('Database connection closed')
						process.exit(0)
					} catch (err) {
						console.error('Error closing DB connection', err)
						process.exit(1)
					}
				})
				// Fallback: force exit if close hangs
				setTimeout(() => {
					console.error('Forcing shutdown')
					process.exit(1)
				}, 10000).unref()
			} catch (err) {
				console.error('Error during shutdown', err)
				process.exit(1)
			}
		}

		process.on('SIGINT', () => shutdown('SIGINT'))
		process.on('SIGTERM', () => shutdown('SIGTERM'))
		process.on('uncaughtException', (err) => {
			console.error('Uncaught exception', err)
			shutdown('uncaughtException')
		})
		process.on('unhandledRejection', (reason) => {
			console.error('Unhandled rejection', reason)
		})

	} catch (err) {
		console.error('Failed to start application', err)
		process.exit(1)
	}
}

start()