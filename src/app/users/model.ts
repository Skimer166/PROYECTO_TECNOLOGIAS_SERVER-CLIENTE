import { Schema, model } from 'mongoose';

const UserSchema = new Schema( //se define el esquema de usuario
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, //el email no se puede repetir
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model('User', UserSchema); //se exporta para usar en otros archivos
