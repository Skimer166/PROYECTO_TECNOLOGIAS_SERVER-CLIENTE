import { connect } from 'mongoose';

export const dbConnect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        connect(process.env.MONGO_URL!)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error('Error al conectar a MongoDB:', error);
                reject(error);
            });
    });
}