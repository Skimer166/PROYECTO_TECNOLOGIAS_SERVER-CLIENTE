import {Request, Response } from "express";

export function login(req: Request, res: Response) {
    console.log('Login: ', req.body)
    res.send({token: 'Bearer1234'})
}

export function signup(req: Request, res: Response) {
    console.log('Signup body', req.body);
    res.send()
}