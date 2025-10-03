import { Request, Response, NextFunction } from 'express';
import { IUser } from "../interfaces/user"

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const { token } = req.query;
    if (token === 'Bearer1234') {
        req.user = {
            id: 123,
            name: 'Juan Perez',
            email: 'juan@iteso.mx'
        }
        next();
        return;
    }
    return res.status(401).send({mensaje: 'no estas loggeado'});
;
}
