import { JwtPayload } from 'jsonwebtoken';

export interface Decode extends JwtPayload {
	id?: number;
	username?: string;
	email?: string;
	iat?: number;
}
