import dotenv from 'dotenv';
dotenv.config()
import express from 'express';
import { dbConnection } from './Databases/db.connection.js';
import { allRoutes } from './src/modules/routes.js';
import { globalErrorHandler } from './src/middleware/globalError.js';

const app = express()
const port = process.env.PORT

await dbConnection()

app.use(express.json())
allRoutes(app)
app.get('/', (req, res) => res.send('Hello World!'))
app.use(globalErrorHandler)
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
