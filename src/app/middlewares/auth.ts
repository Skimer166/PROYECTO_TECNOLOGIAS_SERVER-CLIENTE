import { Request, Response, NextFunction } from 'express';
export function auth(req: Request, res: Response, next: NextFunction) {
    if (req.headers.authorization === 'Bearer 1234') 
        return next();
    return res.sendStatus(401);
}