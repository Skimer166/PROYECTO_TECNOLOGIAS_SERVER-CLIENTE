interface IUser {
    id?: number; //va a hacer opcional
    name: string;
    correo: string;
    password?: string; 
}
export default IUser; 