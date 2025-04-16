import  type { Request, Response } from 'express';

// Middleware to handle routes that don't exist
const notFound = (req: Request, res: Response) => res.status(404).send('Route not found\n');

export default notFound;
