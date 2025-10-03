import {SwaggerOptions} from "swagger-ui-express";

const port = process.env.PORT || 3000;

const options: SwaggerOptions = {
    swaggerDefinition: {
        openapi: '3.1.0',
        info: {
            title: 'API AI Market',
            descripcion: 'esta es la API de nuestra app web "AI MARKET". ',
            version: '0.0.1'
        },
        servers: [
            {url: 'http://localhost:' + process.env.PORT}
        ]
    },
    apis: [
        './src/**/*.ts'     //en cualquiera de las subcarpetas de src, encuentra todos los .ts
    ]
}

export default options;