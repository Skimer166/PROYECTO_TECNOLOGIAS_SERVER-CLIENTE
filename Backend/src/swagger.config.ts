import {SwaggerOptions} from "swagger-ui-express";
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 3000;

const options: SwaggerOptions = {
    swaggerDefinition: {
        openapi: '3.1.0',
        info: {
            title: 'API AI Market',
            description: 'esta es la API de nuestra app web "AI MARKET". ', 
            version: '0.0.1'
        },
        servers: [
            {
                url: process.env.BACKEND_URL || `http://localhost:${port}`,
                description: "Servidor Principal"
            }
        ]
    },
    apis: [
        './src/**/*.ts'
    ]
}

export default options;